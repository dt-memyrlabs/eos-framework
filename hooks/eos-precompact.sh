#!/bin/bash
# EOS PreCompact Hook — fires before context compaction
# Backs up state file and injects recovery instructions via systemMessage
set -euo pipefail

STATE_FILE="$HOME/.claude/eos-state/current-state.json"
BACKUP_DIR="$HOME/.claude/eos-state/backups"

# Read session_id from stdin JSON
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('session_id','unknown'))" 2>/dev/null || echo "unknown")

mkdir -p "$BACKUP_DIR"

if [ -f "$STATE_FILE" ]; then
    # Check file age in seconds (cross-platform via python3)
    FILE_AGE=$(python3 -c "import os,time,sys; print(int(time.time()-os.path.getmtime(sys.argv[1])))" "$STATE_FILE" 2>/dev/null || echo 999)

    # Backup with timestamp
    BACKUP_NAME="state-${SESSION_ID}-$(date +%Y%m%d-%H%M%S).json"
    cp "$STATE_FILE" "$BACKUP_DIR/$BACKUP_NAME"

    # Prune old backups (keep last 20)
    ls -t "$BACKUP_DIR"/state-*.json 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true

    if [ "$FILE_AGE" -gt 300 ]; then
        STALE_MSG="WARNING: EOS state file is ${FILE_AGE}s old (>5min). State may be incomplete."
    else
        STALE_MSG="EOS state backed up (age: ${FILE_AGE}s)."
    fi

    echo "{\"continue\": true, \"systemMessage\": \"COMPACTION IMMINENT. ${STALE_MSG} Post-compaction: read ~/.claude/eos-state/current-state.json to restore EOS runtime state. Increment compaction_count in state file.\"}"
else
    echo "{\"continue\": true, \"systemMessage\": \"COMPACTION IMMINENT. No EOS state file found. Post-compaction: initialize fresh state or query Notion Spoke.\"}"
fi
