# EOS Hooks

Claude Code [hooks](https://code.claude.com/docs/en/hooks) fire on lifecycle events (session start, prompt submit, compaction) and around tool execution. They are deterministic code — rules that live in hooks always run; rules that live in prompt text only run when the model attends to them.

## Available Hooks

### EOS state (Node dispatcher — v22.4)

One script, `eos-hook.js`, handles all four lifecycle events:

| Mode | Event | Purpose |
|------|-------|---------|
| `prompt` | UserPromptSubmit | Injects the EOS state file + v22 header/state mandates into model context on EVERY prompt; parses optional `lens: <name>` steering directives before the model sees the message |
| `session-start` | SessionStart | Injects state file content on session start / post-compaction reload |
| `pre-compact` | PreCompact | Backs up the state file before compaction (keeps 20), warns on stale state (>5min) |
| `session-end` | SessionEnd | Final state backup on session close (keeps 10) |

State injection uses `hookSpecificOutput.additionalContext` — the field that reaches model context. The pre-v22.4 bash state hooks used `systemMessage`, which only displays to the human: state recovery could not function through it on any platform. They also required `python3`, which on Windows commonly resolves to the Microsoft Store stub (prints "Redirecting..." instead of executing). Both failures are why they were replaced.

### Safety / quality (bash)

| Hook | Type | Purpose |
|------|------|---------|
| `credential-guard.sh` | PreToolUse | Blocks Write/Edit on `.env`, credential files, private keys |
| `file-backup.sh` | PreToolUse | Creates timestamped backup before any file is modified |
| `search-year-fix.sh` | PreToolUse | Appends current year to web searches for fresh results |

Scope notes: `credential-guard.sh` and `file-backup.sh` only intercept the Write/Edit tools — file mutations made through Bash commands bypass both. Since v22, Claude Code's native auto-memory and compaction summaries overlap the state hooks; they remain the schema-controlled copy.

## Lens steering (header field as of v22.4.1; value untested)

The user may steer a free-form layer-of-work label by typing `lens: <name>` (or `/lens <name>`, `lens=<name>`) anywhere in a prompt; `lens: off` (or `free`/`unlock`/`auto`) returns the choice to the model. The directive is persisted to the state file and injected before the model reads the prompt. Mechanism: explicit injected instruction — no position-dominance claim (that theory was refuted in the 2026-07-14 experiment). Whether lens labels measurably improve output is an open hypothesis; test with `tools/eos-test` before treating it as load-bearing.

## Installation

1. Copy the dispatcher to `~/.claude/scripts/` and the safety hooks to `~/.claude/hooks/`:

```bash
mkdir -p ~/.claude/scripts ~/.claude/hooks
cp hooks/eos-hook.js ~/.claude/scripts/
cp hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```

2. Merge the hook configuration from `hooks-settings.json` into your `~/.claude/settings.json` or project-level `.claude/settings.local.json`.

   **Everything must be nested under the top-level `"hooks"` key.** Event blocks placed at the top level of settings.json are silently ignored — they appear registered but never fire.

3. Restart your Claude Code session (or open `/hooks` once to reload config).

4. Verify: your next prompt should arrive with an `EOS RUNTIME v22` injection block.

## How Hooks Work

- Hooks receive a JSON payload on stdin (`session_id`, plus `prompt` for UserPromptSubmit or `tool_name`/`tool_input` for tool events)
- Lifecycle hooks inject model-visible context via `{"hookSpecificOutput": {"hookEventName": "...", "additionalContext": "..."}}`
- **PreToolUse** hooks return `{"decision": "approve"}` to proceed, or `{"decision": "block", "reason": "..."}` to prevent the tool from executing
- Bash hooks must be executable (`chmod +x`)

## Requirements

- `node` — any recent version; runs `eos-hook.js` (deliberately no python3)
- `jq` + `bash` — for the PreToolUse safety hooks only (install jq via `apt install jq`, `brew install jq`, or `choco install jq`)

## Customization

### credential-guard.sh

Edit the `case` statement to add patterns for your project's sensitive files. The defaults cover:
- `.env` variants
- `credentials.json`, `service-account*.json`
- Private key files (`.key`, `id_rsa`, etc.)
- Package registry configs (`.npmrc`, `.pypirc`)
- Generic secrets files (`secrets.yaml`, etc.)

### file-backup.sh

Backups go to `~/.claude/file-history/`. Change `BACKUP_DIR` to customize the location. Old backups are not automatically cleaned — add a cron job if disk space is a concern.

### search-year-fix.sh

Queries containing historical years (pre-2025) are left untouched. Adjust the regex in the "historical events" check if your work involves recent years that should not be overridden.
