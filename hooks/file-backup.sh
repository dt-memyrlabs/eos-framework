#!/usr/bin/env bash
# EOS Hook: File Backup
# Type: PreToolUse
# Purpose: Creates timestamped backups of files before Write/Edit operations
#
# Maintains a history at ~/.claude/file-history/ so you can recover from
# any unintended file mutation. Backups are named with ISO timestamp.
#
# Install: Add to .claude/settings.json under hooks (see hooks-settings.json)

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

# Only backup on Write and Edit
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# No file path or file doesn't exist yet (new file creation) = skip
if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Create backup directory
BACKUP_DIR="${HOME}/.claude/file-history"
mkdir -p "$BACKUP_DIR"

# Generate backup filename: original-name_YYYY-MM-DD_HHMMSS.ext
BASENAME=$(basename "$FILE_PATH")
NAME="${BASENAME%.*}"
EXT="${BASENAME##*.}"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)

if [[ "$NAME" == "$EXT" ]]; then
  # No extension (e.g., Makefile)
  BACKUP_NAME="${NAME}_${TIMESTAMP}"
else
  BACKUP_NAME="${NAME}_${TIMESTAMP}.${EXT}"
fi

cp "$FILE_PATH" "${BACKUP_DIR}/${BACKUP_NAME}" 2>/dev/null || true

# Always approve — this hook only creates backups, never blocks
echo '{"decision": "approve"}'
