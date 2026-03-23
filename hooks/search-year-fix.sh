#!/usr/bin/env bash
# EOS Hook: Search Year Fix
# Type: PreToolUse
# Purpose: Appends current year to web search queries to avoid stale results
#
# Claude's training data has a cutoff. Without the current year in search queries,
# results often return outdated documentation and deprecated approaches.
# This hook injects the current year into search queries automatically.
#
# Install: Add to .claude/settings.json under hooks (see hooks-settings.json)

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only modify WebSearch queries
if [[ "$TOOL_NAME" != "WebSearch" ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

QUERY=$(echo "$INPUT" | jq -r '.tool_input.query // empty')
CURRENT_YEAR=$(date +%Y)

# Skip if query already contains the current year
if echo "$QUERY" | grep -q "$CURRENT_YEAR"; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Skip if query is about historical events (contains past years)
if echo "$QUERY" | grep -qE '(19[0-9]{2}|20[0-1][0-9]|202[0-4])'; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Append current year to the query
MODIFIED_QUERY="${QUERY} ${CURRENT_YEAR}"
echo "{\"decision\": \"approve\", \"tool_input\": {\"query\": \"${MODIFIED_QUERY}\"}}"
