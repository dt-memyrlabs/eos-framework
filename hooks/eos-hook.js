#!/usr/bin/env node
// EOS v22 hook dispatcher — deterministic state injection + user lens steering.
// Replaces the bash state hooks (eos-session-start.sh / eos-precompact.sh /
// eos-session-end.sh), which had two fatal flaws: they injected via systemMessage
// (displays to the human; never reaches model context — additionalContext does),
// and they depended on python3 (on Windows this often resolves to the Microsoft
// Store stub, which prints "Redirecting..." instead of executing).
// Usage: node eos-hook.js <prompt|session-start|pre-compact|session-end|pretool>
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
// EOS_VAULT (v22.7.0): optional location or name of the user's project store, named in the prompt mandate.
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

// Picture gate (v22.9.0). goal.state is one of: open (no picture), pictured (the
// model has written its picture — end state, in, out, done — and is waiting for
// the user to confirm the MATCH), locked (user confirmed). Build actions are
// allowed only at locked. Legacy shape {active_goal, goal_locked} is upgraded
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
// Paths a closed gate must never block: the framework's own state, the project
// store (EOS_VAULT, if set), and lesson files (a correction must always be writable).
const ALLOW = [DIR].concat(process.env.EOS_VAULT ? [process.env.EOS_VAULT] : []).map(p => path.resolve(p).toLowerCase());
function allowed(fp) {
  if (!fp) return false;
  const r = path.resolve(String(fp)).toLowerCase();
  if (ALLOW.some(a => r === a || r.startsWith(a + path.sep))) return true;
  return /[\\/]tasks[\\/]lessons\.md$/.test(r);
}

let raw = '';
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => {
  let input = {}; try { input = JSON.parse(raw); } catch {}
  const sid = input.session_id || 'unknown';

  if (EVENT === 'session-end') {
    backup('final', sid, 10);
    out({ continue: true });
    return;
  }

  if (EVENT === 'pretool') {
    // PreToolUse — the deterministic half of the picture gate. Blocks Write/Edit/
    // NotebookEdit outside the allowlist while goal.state != locked. Bash is NOT
    // filtered: a Bash filter that catches file writes without catching reads is
    // a separate piece of work, and this hole is documented in the kernel.
    const state = readState();
    const g = normalizeGoal(state);
    const tool = String(input.tool_name || '');
    const fp = input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path);
    if (g && g.state !== 'locked' && /^(Write|Edit|NotebookEdit)$/.test(tool) && !allowed(fp)) {
      const reason = `EOS BUILD GATE: goal:${g.state}. ${tool} on ${fp || '(no path)'} is a build action and the user has not confirmed the picture. Show the picture and get the match confirmed, or the user sends "goal: confirmed".`;
      out({ decision: 'block', reason, hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });
      return;
    }
    out({ continue: true, suppressOutput: true });
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
    lines.push(`state: ${JSON.stringify(state)}`);
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
  try {
    const lessons = fs.readFileSync(path.join(DIR, 'lessons-distilled.md'), 'utf8')
      .split(/\r?\n/).filter(l => l.startsWith('- ')).join('\n');
    if (lessons) lines.push('LESSONS (standing, apply to every response):\n' + lessons);
  } catch {}
  lines.push('MANDATES: begin the response with the v22 runtime header — [lens:name] [goal:open|pictured|locked] [assump:N] [conf:H/M/L] [pos:held/moved|basis] — facts only, per Rule 2. goal is the picture-gate state, not whether a goal sentence exists. Default to brief — expand only when asked. Resolve ambiguity from the data before asking the user — a question the files can answer is a defect. Project state lives in ' + (VAULT ? 'the project store at ' + VAULT : 'your project store (notes vault or docs tool)') + ' — write it there on a lock or a close; this state file carries reasoning-framework state only: goal, lens, assumptions, positions, regression locks, framework locks. On any framework state-change (goal, lens, assumption open/close, position, framework lock) update the state file via the Write tool — max one write per response. Lens steering: "lens: <name>" anywhere in a prompt; "lens: off" to unlock.');

  out({
    hookSpecificOutput: {
      hookEventName: EVENT === 'prompt' ? 'UserPromptSubmit' : 'SessionStart',
      additionalContext: lines.join('\n')
    },
    suppressOutput: true
  });
});
