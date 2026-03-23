#!/usr/bin/env bash
# EOS Hook: Credential Guard
# Type: PreToolUse
# Purpose: Blocks Write/Edit operations on sensitive files (.env, credentials, key files)
#
# Claude's safety system already prevents most credential exposure, but this hook
# provides a hard filesystem-level gate that fires before the tool executes.
#
# Install: Add to .claude/settings.json under hooks (see hooks-settings.json)

set -euo pipefail

# Read the tool use event from stdin
INPUT=$(cat)

# Extract tool name and file path
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

# Only check Write and Edit operations
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# No file path = nothing to guard
if [[ -z "$FILE_PATH" ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")
LOWER_BASENAME=$(echo "$BASENAME" | tr '[:upper:]' '[:lower:]')

# Blocked patterns
BLOCKED=false
REASON=""

case "$LOWER_BASENAME" in
  .env|.env.local|.env.production|.env.development|.env.staging|.env.*)
    BLOCKED=true
    REASON="Environment file: $BASENAME"
    ;;
  .credentials.json|credentials.json|service-account*.json)
    BLOCKED=true
    REASON="Credentials file: $BASENAME"
    ;;
  *_key|*_key.pem|*.key|id_rsa|id_ed25519|id_ecdsa)
    BLOCKED=true
    REASON="Private key file: $BASENAME"
    ;;
  .npmrc|.pypirc|.docker/config.json)
    BLOCKED=true
    REASON="Package registry credentials: $BASENAME"
    ;;
  *.secrets|secrets.yaml|secrets.yml|secrets.json)
    BLOCKED=true
    REASON="Secrets file: $BASENAME"
    ;;
esac

# Check for token/api-key patterns in path
if [[ "$LOWER_BASENAME" == *"token"* && "$LOWER_BASENAME" == *".json"* ]]; then
  BLOCKED=true
  REASON="Token file: $BASENAME"
fi

if [[ "$BLOCKED" == "true" ]]; then
  echo "{\"decision\": \"block\", \"reason\": \"Credential Guard: $REASON. Edit this file manually.\"}"
  exit 0
fi

echo '{"decision": "approve"}'
