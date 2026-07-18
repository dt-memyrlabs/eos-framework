# EOS Hooks

Claude Code [hooks](https://code.claude.com/docs/en/hooks) fire on lifecycle events (session start, prompt submit, compaction) and around tool execution. They provide a deterministic, filesystem-level layer that operates independently of Claude's attention — rules that live in code always run; rules that live in prompt text only run when the model attends to them.

## Available Hooks

### EOS runtime (Node dispatcher — v21.1)

One script, `eos-hook.js`, handles all four lifecycle events:

| Mode | Event | Purpose |
|------|-------|---------|
| `prompt` | UserPromptSubmit | **The load-bearing one.** Injects the EOS state file + runtime mandates into model context on EVERY prompt, and parses user lens-steering directives (`lens: <name>`) before the model sees the message |
| `session-start` | SessionStart | Injects state file content on session start and post-compaction reload |
| `pre-compact` | PreCompact | Backs up the state file before compaction, warns on stale state (>5min), injects recovery instructions |
| `session-end` | SessionEnd | Final state backup on session close |

State injection uses `hookSpecificOutput.additionalContext` — the field that actually reaches the model. (`systemMessage` only displays text to the human; hooks that use it for state recovery inject nothing.)

### Safety / quality (bash)

| Hook | Event | Purpose |
|------|-------|---------|
| `credential-guard.sh` | PreToolUse | Blocks Write/Edit on `.env`, credential files, private keys |
| `file-backup.sh` | PreToolUse | Creates timestamped backup before any file is modified |
| `search-year-fix.sh` | PreToolUse | Appends current year to web searches for fresh results |

## Lens steering (UserPromptSubmit)

The user steers the model's lens by typing a directive anywhere in a prompt:

```
lens: build        → steer + lock the lens to "build"
/lens pitch        → same, slash form
lens: off          → unlock; lens choice returns to the model
```

The hook writes the directive to the state file and injects "generate the entire response under this lens" *before the model reads the prompt* — steering at the position of maximum attention leverage. Lens names are free-form by design: the frame is rigid (the slot must be filled), the interior is free (any name works). `off`, `free`, `unlock`, and `auto` are reserved for unlocking.

## Installation

1. Copy the EOS dispatcher to `~/.claude/scripts/` and the safety hooks to `~/.claude/hooks/`:

```bash
mkdir -p ~/.claude/scripts ~/.claude/hooks
cp hooks/eos-hook.js ~/.claude/scripts/
cp hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```

2. Merge the hook configuration from `hooks-settings.json` into your `~/.claude/settings.json` or project-level `.claude/settings.local.json`.

   **Everything must be nested under the top-level `"hooks"` key.** Event blocks placed at the top level of settings.json are silently ignored — the hooks will appear registered but never fire.

3. Restart your Claude Code session (or open `/hooks` once to reload config).

4. Verify: your next prompt should arrive with an `EOS RUNTIME` injection block, and `lens: test` in a message should be acknowledged in the response header.

## How Hooks Work

- Hooks receive a JSON payload on stdin (`session_id`, plus `prompt` for UserPromptSubmit or `tool_name`/`tool_input` for tool events)
- Lifecycle hooks inject model-visible context via `{"hookSpecificOutput": {"hookEventName": "...", "additionalContext": "..."}}`
- **PreToolUse** hooks return `{"decision": "approve"}` to proceed, or `{"decision": "block", "reason": "..."}` to prevent execution
- Hooks must be executable (`chmod +x` for the bash ones)

## Requirements

- `node` — any recent version; runs `eos-hook.js` (no python3: on Windows, `python3` often resolves to the Microsoft Store stub, which prints "Redirecting..." instead of executing — this silently broke the v21.0 bash hooks)
- `bash` + `jq` — for the PreToolUse safety hooks only

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

### eos-hook.js

State file location: `~/.claude/eos-state/current-state.json`; backups in `~/.claude/eos-state/backups/` (pre-compact keeps 20, session-end keeps 10). Steering regex accepts `lens: <name>`, `lens=<name>`, `/lens <name>` — names start with a letter, then letters/digits/hyphen/underscore.
