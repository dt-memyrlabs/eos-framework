# EOS Hooks

Claude Code [hooks](https://code.claude.com/docs/en/hooks) are shell scripts that fire before or after tool execution. They provide a hard filesystem-level gate that operates independently of Claude's reasoning.

## Available Hooks

| Hook | Type | Purpose |
|------|------|---------|
| `credential-guard.sh` | PreToolUse | Blocks Write/Edit on `.env`, credential files, private keys |
| `file-backup.sh` | PreToolUse | Creates timestamped backup before any file is modified |
| `search-year-fix.sh` | PreToolUse | Appends current year to web searches for fresh results |

## Installation

1. Copy hook scripts to `~/.claude/hooks/`:

```bash
mkdir -p ~/.claude/hooks
cp hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```

2. Merge the hook configuration from `hooks-settings.json` into your `~/.claude/settings.json` or project-level `.claude/settings.local.json`.

   The key structure goes under the `"hooks"` field. See `hooks-settings.json` for the exact format.

3. Restart your Claude Code session.

## How Hooks Work

- **PreToolUse** hooks receive a JSON payload on stdin with `tool_name` and `tool_input` fields
- They return a JSON response: `{"decision": "approve"}` to proceed, or `{"decision": "block", "reason": "..."}` to prevent the tool from executing
- PreToolUse hooks can also modify tool input by returning `{"decision": "approve", "tool_input": {...}}`
- Hooks must be executable (`chmod +x`) and require `jq` for JSON parsing

## Requirements

- `jq` — JSON processor (install via `apt install jq`, `brew install jq`, or `choco install jq`)
- `bash` — standard shell

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
