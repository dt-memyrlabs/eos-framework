#!/bin/bash
# EOS SessionStart Hook — fires on session start and post-compaction reload
# Injects state file content as systemMessage for immediate recovery
set -euo pipefail

STATE_FILE="$HOME/.claude/eos-state/current-state.json"

if [ -f "$STATE_FILE" ]; then
    # Compact JSON to minimize token usage
    STATE=$(python3 -c "import sys,json; d=json.load(open(sys.argv[1])); print(json.dumps(d,separators=(',',':')))" "$STATE_FILE" 2>/dev/null || cat "$STATE_FILE")

    # Escape for JSON embedding (handle quotes and newlines)
    ESCAPED=$(python3 -c "
import sys, json
with open(sys.argv[1]) as f:
    d = json.load(f)
compact = json.dumps(d, separators=(',',':'))
# Double-escape for embedding in JSON string
print(compact.replace('\\\\','\\\\\\\\').replace('\"','\\\\\"'))
" "$STATE_FILE" 2>/dev/null || echo "error reading state")

    echo "{\"continue\": true, \"systemMessage\": \"EOS_STATE_RECOVERY: ${ESCAPED}\"}"
else
    echo "{\"continue\": true, \"systemMessage\": \"EOS_STATE: No state file found. Fresh session. Initialize state on first state-change event.\"}"
fi
