#!/usr/bin/env node
// EOS v22 hook dispatcher — deterministic state injection + user lens steering.
// Replaces the bash state hooks (eos-session-start.sh / eos-precompact.sh /
// eos-session-end.sh), which had two fatal flaws: they injected via systemMessage
// (displays to the human; never reaches model context — additionalContext does),
// and they depended on python3 (on Windows this often resolves to the Microsoft
// Store stub, which prints "Redirecting..." instead of executing).
// Usage: node eos-hook.js <prompt|session-start|pre-compact|session-end>
//
// Lens steering (UserPromptSubmit; header field since v22.4.1, binding contract from lenses.md since v22.8.0):
// the user writes "lens: <name>" (or /lens <name>, lens=<name>) anywhere in a
// prompt to steer + lock a free-form layer-of-work label. "lens: off|free|unlock|auto"
// returns the choice to the model. The directive is persisted to the state file
// BEFORE the model sees the prompt. Mechanism: explicit injected instruction —
// no claim about token position is made (the position-dominance theory was
// refuted in the 2026-07-14 experiment; specificity, not position).

const fs = require('fs'), os = require('os'), path = require('path');

const EVENT = process.argv[2] || 'prompt';
// EOS_STATE_DIR overrides the global state location — set it in a project's
// .claude/settings.json hook commands for per-project state isolation.
const DIR = process.env.EOS_STATE_DIR || path.join(os.homedir(), '.claude', 'eos-state');
const STATE = path.join(DIR, 'current-state.json');
// EOS_VAULT (v22.7.0): optional location of the user's project store, named in the prompt mandate.
// Since v22.10.0 it must be a directory path for the session wiki context to load; unset = none injected.
const VAULT = process.env.EOS_VAULT || '';
const BACKUPS = path.join(DIR, 'backups');

function readState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return null; } }
function writeState(s) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(s, null, 2) + '\n'); }
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function backup(prefix, sessionId, keep) {
  if (!fs.existsSync(STATE)) return false;
  fs.mkdirSync(BACKUPS, { recursive: true });
  fs.copyFileSync(STATE, path.join(BACKUPS, `${prefix}-${sessionId}-${stamp()}.json`));
  const stale = fs.readdirSync(BACKUPS).filter(f => f.startsWith(prefix + '-')).sort().reverse().slice(keep);
  for (const f of stale) { try { fs.unlinkSync(path.join(BACKUPS, f)); } catch {} }
  return true;
}
function out(obj) { process.stdout.write(JSON.stringify(obj)); }

// Vault context (v22.10.0). The project store (EOS_VAULT, a notes vault) can hold an
// agent-written wiki (wiki/SCHEMA.md). Session start injects where the wiki is, which
// project pages exist, and — when the cwd maps to a project — that page's current
// state and open threads. Session start only: per-prompt bytes stay framework-only.
// cwd -> project page, from <vault>/wiki/project-map.json ({"cwd": {"<project>": ["<substring>", ...]}}).
// First project with a substring found in the lower-cased cwd wins. No map = no project match.
function projectOf(cwd) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(VAULT, 'wiki', 'project-map.json'), 'utf8'));
    const map = cfg.cwd || {};
    const c = String(cwd || '').toLowerCase();
    // cwd_exclude: working directories that never get a project page (for example automated agent sandboxes).
    if ((cfg.cwd_exclude || []).some(s => c.includes(String(s).toLowerCase()))) return null;
    for (const [proj, subs] of Object.entries(map)) if ((subs || []).some(s => c.includes(String(s).toLowerCase()))) return proj;
  } catch {}
  return null;
}
function sectionOf(text, heading, max) {
  const t = text.replace(/\r/g, '');
  const i = t.indexOf('\n' + heading + '\n'); if (i < 0) return '';
  const rest = t.slice(i + heading.length + 2); const j = rest.search(/\n## /);
  const body = (j < 0 ? rest : rest.slice(0, j)).trim();
  return body.length > max ? body.slice(0, max) + ' […cut; read the page]' : body;
}
function vaultContext(cwd) {
  if (!VAULT) return '';
  try {
    const dir = path.join(VAULT, 'wiki', 'projects');
    if (!fs.existsSync(dir)) return `VAULT: ${VAULT} is the project store (map: index.md). No wiki project pages found.`;
    const pages = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    const lines = [`VAULT CONTEXT — ${VAULT} is the project store. Session wiki: wiki/index.md (catalog), wiki/SCHEMA.md (rules), wiki/projects/ (current state per project), wiki/sessions/ (one page per past session). Read the project page before you claim anything about project state or past work; it outranks memory. Project pages: ${pages.map(f => f.replace(/\.md$/, '')).join(', ') || '(none)'}.`];
    const proj = projectOf(cwd);
    if (proj && pages.includes(proj + '.md')) {
      const text = fs.readFileSync(path.join(dir, proj + '.md'), 'utf8');
      const upd = (text.match(/^updated:\s*(.+)$/m) || [])[1] || 'unknown';
      const stands = sectionOf(text, '## Where it stands', 1400), open = sectionOf(text, '## Open threads', 1400);
      lines.push(`THIS SESSION'S PROJECT (from cwd): ${proj} — wiki/projects/${proj}.md, built from sessions up to ${upd}. It is a record of past sessions, not live state: verify against the code or system before acting on it.`);
      if (stands) lines.push('WHERE IT STANDS:\n' + stands);
      if (open) lines.push('OPEN THREADS:\n' + open);
    }
    return lines.join('\n');
  } catch { return `VAULT: ${VAULT} is the project store. (wiki context unreadable)`; }
}

// Picture gate (v22.9.0). goal.state is one of: open (no picture), pictured (the
// model has written its picture — end state, in, out, done — and is waiting for
// the user to confirm the MATCH), locked (user confirmed). Build actions are
// allowed only at locked — as a rule the model follows and the hook reminds it of
// every prompt, not as a tool block (a PreToolUse blocker was built and deleted
// 2026-09-15: a thinking framework is not a permission system). Legacy shape {active_goal, goal_locked} is upgraded
// in place: a legacy locked goal stays locked (no confirmed picture exists for
// it, and that is recorded rather than invented).
function normalizeGoal(state) {
  if (!state) return null;
  if (state.goal && typeof state.goal === 'object' && state.goal.state) return state.goal;
  const g = {
    state: state.goal_locked ? 'locked' : 'open',
    text: state.active_goal || '',
    picture: null,
    confirmed: state.goal_locked ? 'legacy goal_locked=true (no picture on record)' : null,
  };
  state.goal = g;
  delete state.active_goal; delete state.goal_locked;
  return g;
}
function gateText(g) {
  if (!g || g.state === 'open') {
    return 'BUILD GATE CLOSED — goal:open. No confirmed picture exists. Resolve what the data can settle first (self-clarify), then write the PICTURE in your own words, not the user\'s echoed back: end state; in scope; out of scope; what "done" looks like. Ask only what the data could not settle. Output until the user confirms the match = the picture and questions. No file writes, no builds, no deploys, no "let me just". When you have written the picture, set goal.state=pictured in the state file.';
  }
  if (g.state === 'pictured') {
    return 'BUILD GATE CLOSED — goal:pictured. The picture is waiting for the user to confirm the MATCH (not the topic). If the user has not seen it this turn, show it. If the user corrects it, revise and show again. Build nothing. When the user confirms, set goal.state=locked with the confirmation quoted in goal.confirmed. The user can also send "goal: confirmed" directly.\nPICTURE ON RECORD: ' + JSON.stringify(g.picture || g.text);
  }
  return 'BUILD GATE OPEN — goal:locked' + (g.confirmed ? ' (' + g.confirmed + ')' : '') + '. If the work in front of you no longer fits the goal text, say so and reopen with "goal: open" rather than building on a picture the user has not confirmed.';
}
let raw = '';
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => {
  let input = {}; try { input = JSON.parse(raw); } catch {}
  const sid = input.session_id || 'unknown';

  if (EVENT === 'session-end') {
    backup('final', sid, 10);
    // Queue the session for wiki ingest (v22.10.0). One line; the ingest run clears it.
    try {
      const q = path.join(VAULT, 'wiki', 'raw', '_pending.md');
      if (VAULT && fs.existsSync(path.dirname(q))) fs.appendFileSync(q, `- ${new Date().toISOString()} | ${sid} | ${String(input.cwd || '').replace(/\\/g, '/')}\n`);
    } catch {}
    out({ continue: true });
    return;
  }

  if (EVENT === 'pre-compact') {
    let msg;
    if (fs.existsSync(STATE)) {
      const age = Math.round((Date.now() - fs.statSync(STATE).mtimeMs) / 1000);
      backup('precompact', sid, 20);
      msg = `COMPACTION IMMINENT. EOS state backed up (age ${age}s${age > 300 ? ' — STALE >5min, state may be incomplete; dump current runtime state to the state file before continuing' : ''}). Post-compaction, the UserPromptSubmit hook re-injects state automatically; increment compaction_count on next state write.`;
    } else {
      msg = 'COMPACTION IMMINENT. No EOS state file found. Post-compaction: initialize fresh state on first state-change event.';
    }
    out({ continue: true, systemMessage: msg, hookSpecificOutput: { hookEventName: 'PreCompact', additionalContext: msg } });
    return;
  }

  // 'prompt' (UserPromptSubmit) and 'session-start' (SessionStart) share the injection body.
  let state = readState();
  let steer = '';

  if (EVENT === 'prompt') {
    const prompt = String(input.prompt || '');
    const m = prompt.match(/(?:^|[\s,.!?])(?:\/lens|lens\s*[:=])\s*([A-Za-z][A-Za-z0-9_-]*)/i);
    if (m) {
      const v = m[1].toLowerCase();
      state = state || { eos_version: 'v21.0.0' };
      state.session_id = sid;
      state.timestamp = new Date().toISOString();
      if (['off', 'free', 'unlock', 'auto'].includes(v)) {
        state.lens_locked_by_user = false;
        steer = 'LENS UNLOCKED this turn — lens choice returns to the model. Announce the lens you pick.';
      } else {
        state.lens = v;
        state.lens_locked_by_user = true;
        steer = `LENS STEERED this turn -> "${v}". Acknowledge the switch, then generate the entire response under this lens.`;
      }
      try { writeState(state); } catch {}
    }
    // Goal directives: "goal: confirmed" locks (the user confirming the match in
    // their own words); "goal: open" reopens the gate. Both persist before the
    // model sees the prompt, same as lens steering.
    const gm = prompt.match(/(?:^|[\s,.!?])goal\s*[:=]\s*(confirmed|confirm|match|locked|open|reopen)\b/i);
    if (gm) {
      state = state || { eos_version: 'v22.9.0' };
      const g = normalizeGoal(state) || (state.goal = { state: 'open', text: '', picture: null, confirmed: null });
      const v = gm[1].toLowerCase();
      state.session_id = sid; state.timestamp = new Date().toISOString();
      if (v === 'open' || v === 'reopen') {
        g.state = 'open'; g.confirmed = null;
        steer += (steer ? '\n' : '') + 'GOAL REOPENED by the user this turn. Write a fresh picture before any build action.';
      } else {
        g.state = 'locked'; g.confirmed = 'user directive "goal: ' + v + '" ' + new Date().toISOString().slice(0, 10);
        steer += (steer ? '\n' : '') + 'GOAL CONFIRMED by the user this turn — the picture on record is the match. Build gate open.';
      }
      try { writeState(state); } catch {}
    }
  }
  const goal = normalizeGoal(state);


  const lines = [];
  lines.push(`EOS RUNTIME v22 (deterministic ${EVENT === 'prompt' ? 'per-prompt' : 'session-start'} injection):`);
  if (state) {
    // goal.picture is left out of the state line: gateText() prints it while the gate waits, and once
    // locked it is history. It stays in the state file.
    const slim = Object.assign({}, state, state.goal && typeof state.goal === 'object' ? { goal: Object.assign({}, state.goal, { picture: undefined }) } : {});
    lines.push(`state: ${JSON.stringify(slim)}`);
    if (state.lens) lines.push(`lens: ${state.lens}${state.lens_locked_by_user ? ' [USER-LOCKED — hold until the user sends "lens: off" or steers a new value]' : ' [free choice]'}`);
  } else {
    lines.push(`state: none — fresh session. Initialize ${STATE} on first state-change event.`);
  }
  if (steer) lines.push(steer);
  if (state) lines.push(gateText(goal));
  // Lens contract (v22.8.0). Before this, nothing consumed the lens value —
  // it was a label plus an instruction to obey the label, which is why the
  // 2026-08-24 eos-test measured it at null. Now the lens selects a binding
  // scope contract from lenses.md: what counts as evidence, what "done" means,
  // what may be touched, what failure mode to guard against. Only the active
  // lens's block is injected, so the registry can grow without per-prompt cost.
  if (state && state.lens) {
    try {
      const reg = fs.readFileSync(path.join(DIR, 'lenses.md'), 'utf8');
      const blocks = {};
      let cur = null;
      for (const l of reg.split(/\r?\n/)) {
        const h = l.match(/^##\s+(.+?)\s*$/);
        if (h) { cur = h[1].toLowerCase(); blocks[cur] = []; continue; }
        if (cur && /^(evidence|done|scope|guard):/i.test(l)) blocks[cur].push(l.trim());
      }
      const key = String(state.lens).toLowerCase();
      if (blocks[key] && blocks[key].length) {
        lines.push(`LENS CONTRACT — ${state.lens} (BINDING this response; a claim that fails "evidence" does not ship, "done" is not sayable until met, work outside "scope" needs the user first):\n` + blocks[key].join('\n') +
          `\nIf this contract does not fit the work in front of you, say so out loud and name the lens that does — never switch silently. When the contract changes the output (blocks a "done", forces a check you would have skipped, refuses an out-of-scope edit), append one line to ${path.join(DIR, 'lens-log.jsonl')} — that log is the instrument for whether this field earns its place.`);
      } else {
        lines.push(`LENS "${state.lens}" has no contract in lenses.md. Known: ${Object.keys(blocks).join(', ') || '(registry unreadable)'}. Flag this and either steer to a known lens or write the contract — do not proceed on the bare label.`);
      }
    } catch {
      lines.push(`LENS CONTRACT UNAVAILABLE — ${path.join(DIR, 'lenses.md')} could not be read. Say so; do not treat the lens as binding.`);
    }
  }
  // Distilled lessons: injected every prompt in every project. Fix for the
  // 2026-08-24 recurrence measurement — per-repo tasks/lessons.md silos meant
  // project sessions never saw the global lessons (6/8 mature lessons recurred).
  // Session start skips the lessons: the first UserPromptSubmit carries them moments later, and the
  // two together with the vault context would cross the harness limit (see BUDGET below).
  if (EVENT === 'prompt') try {
    const lessons = fs.readFileSync(path.join(DIR, 'lessons-distilled.md'), 'utf8')
      .split(/\r?\n/).filter(l => l.startsWith('- ')).join('\n');
    if (lessons) lines.push('LESSONS (standing, apply to every response):\n' + lessons);
  } catch {}
  if (EVENT === 'session-start') { const vc = vaultContext(input.cwd); if (vc) lines.push(vc); }
  lines.push('MANDATES: begin the response with the v22 runtime header — [lens:name] [goal:open|pictured|locked] [assump:N] [conf:H/M/L] [pos:held/moved|basis] — facts only, per Rule 2. goal is the picture-gate state, not whether a goal sentence exists. Default to brief — expand only when asked. Resolve ambiguity from the data before asking the user — a question the files can answer is a defect. Project state lives in ' + (VAULT ? 'the project store at ' + VAULT : 'your project store (notes vault or docs tool)') + ' — write it there on a lock or a close; this state file carries reasoning-framework state only: goal, lens, assumptions, positions, regression locks, framework locks. On any framework state-change (goal, lens, assumption open/close, position, framework lock) update the state file via the Write tool — max one write per response. Lens steering: "lens: <name>" anywhere in a prompt; "lens: off" to unlock.');

  // BUDGET (v22.10.0): Claude Code replaces a hook output above roughly 10,000 characters with a 2 KB
  // preview and a file path, so everything after the state line silently never reaches the model
  // (measured 2026-09-19: 10,035 chars was cut). Fail loudly, at the top, where the preview still shows it.
  const BUDGET = 9500;
  let text = lines.join('\n');
  if (text.length > BUDGET) text = `EOS INJECTION OVER BUDGET: ${text.length} characters, limit about 10,000. The harness shows the model only the first 2 KB of this block, so the lens contract, lessons and mandates below are NOT in context. Tell the user now. Fix: shorten ${path.join(DIR, 'lessons-distilled.md')} or ${STATE}.\n` + text;
  out({
    hookSpecificOutput: {
      hookEventName: EVENT === 'prompt' ? 'UserPromptSubmit' : 'SessionStart',
      additionalContext: text
    },
    suppressOutput: true
  });
});
