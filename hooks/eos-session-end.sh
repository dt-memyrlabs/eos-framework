#!/bin/bash
# EOS SessionEnd Hook — final backup of state file on session close
set -euo pipefail

STATE_FILE="$HOME/.claude/eos-state/current-state.json"
BACKUP_DIR="$HOME/.claude/eos-state/backups"

# Read session_id from stdin JSON
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('session_id','unknown'))" 2>/dev/null || echo "unknown")

mkdir -p "$BACKUP_DIR"

if [ -f "$STATE_FILE" ]; then
    cp "$STATE_FILE" "$BACKUP_DIR/final-${SESSION_ID}-$(date +%Y%m%d-%H%M%S).json"
    # Prune old final backups (keep last 10)
    ls -t "$BACKUP_DIR"/final-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
fi

echo "{\"continue\": true}"
