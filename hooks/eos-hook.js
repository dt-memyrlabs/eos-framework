#!/usr/bin/env node
// EOS v22 hook dispatcher — deterministic state injection + user lens steering.
// Replaces the bash state hooks (eos-session-start.sh / eos-precompact.sh /
// eos-session-end.sh), which had two fatal flaws: they injected via systemMessage
// (displays to the human; never reaches model context — additionalContext does),
// and they depended on python3 (on Windows this often resolves to the Microsoft
// Store stub, which prints "Redirecting..." instead of executing).
// Usage: node eos-hook.js <prompt|session-start|pre-compact|session-end>
//
// Lens steering (UserPromptSubmit; lens is a header field as of v22.4.1 — value untested, see changelog):
// the user writes "lens: <name>" (or /lens <name>, lens=<name>) anywhere in a
// prompt to steer + lock a free-form layer-of-work label. "lens: off|free|unlock|auto"
// returns the choice to the model. The directive is persisted to the state file
// BEFORE the model sees the prompt. Mechanism: explicit injected instruction —
// no claim about token position is made (the position-dominance theory was
// refuted in the 2026-07-14 experiment; specificity, not position).

const fs = require('fs'), os = require('os'), path = require('path');

const EVENT = process.argv[2] || 'prompt';
const DIR = path.join(os.homedir(), '.claude', 'eos-state');
const STATE = path.join(DIR, 'current-state.json');
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
  }

  const lines = [];
  lines.push(`EOS RUNTIME v22 (deterministic ${EVENT === 'prompt' ? 'per-prompt' : 'session-start'} injection):`);
  if (state) {
    lines.push(`state: ${JSON.stringify(state)}`);
    if (state.lens) lines.push(`lens: ${state.lens}${state.lens_locked_by_user ? ' [USER-LOCKED — hold until the user sends "lens: off" or steers a new value]' : ' [free choice]'}`);
  } else {
    lines.push('state: none — fresh session. Initialize ~/.claude/eos-state/current-state.json on first state-change event.');
  }
  if (steer) lines.push(steer);
  lines.push('MANDATES: begin the response with the v22 runtime header — [lens:name] [goal:locked|open] [assump:N] [conf:H/M/L] [pos:held/moved|basis] — facts only, per Rule 2. Default to brief — expand only when asked. On any state-change trigger (goal, variable lock, assumption open/close, position, threads, decision) write decision-locks to Notion when available and update the state file via the Write tool — max one write per response. Lens steering: "lens: <name>" anywhere in a prompt; "lens: off" to unlock.');

  out({
    hookSpecificOutput: {
      hookEventName: EVENT === 'prompt' ? 'UserPromptSubmit' : 'SessionStart',
      additionalContext: lines.join('\n')
    },
    suppressOutput: true
  });
});
