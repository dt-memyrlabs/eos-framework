#!/bin/bash
# EOS Skill Validator
# Compares skill_versions in kernel against YAML frontmatter in skill files.
# Usage: ./tools/validate-skills.sh [kernel_path] [skills_dir]

set -euo pipefail

KERNEL="${1:-kernel/CLAUDE.md}"
SKILLS_DIR="${2:-skills}"

if [[ ! -f "$KERNEL" ]]; then
    echo "ERROR: Kernel not found at $KERNEL"
    exit 1
fi

# Extract skill_versions line from kernel
VERSIONS_LINE=$(grep '^skill_versions:' "$KERNEL" | head -1)

if [[ -z "$VERSIONS_LINE" ]]; then
    echo "ERROR: No skill_versions line found in $KERNEL"
    exit 1
fi

# Parse kernel version
KERNEL_VERSION=$(head -1 "$KERNEL" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
echo "Kernel version: $KERNEL_VERSION"
echo "---"

PASS=0
FAIL=0
MISSING=0

# Parse each skill:version pair from the kernel line
echo "$VERSIONS_LINE" | sed 's/skill_versions:\s*//' | tr '|' '\n' | while read -r pair; do
    pair=$(echo "$pair" | xargs)  # trim whitespace
    [[ -z "$pair" ]] && continue

    SKILL_NAME=$(echo "$pair" | cut -d: -f1 | xargs)
    EXPECTED_VERSION=$(echo "$pair" | cut -d: -f2 | xargs)

    # Find the skill file (search recursively in skills dir)
    SKILL_FILE=$(find "$SKILLS_DIR" -name "${SKILL_NAME}.md" -type f 2>/dev/null | head -1)

    if [[ -z "$SKILL_FILE" ]]; then
        echo "MISSING  $SKILL_NAME — expected $EXPECTED_VERSION, file not found"
        echo "MISSING" >> /tmp/eos_validate_counts
        continue
    fi

    # Extract version from YAML frontmatter
    ACTUAL_VERSION=$(grep -m1 '^version:' "$SKILL_FILE" | sed 's/version:\s*//' | tr -d '"' | xargs)

    if [[ "$ACTUAL_VERSION" == "$EXPECTED_VERSION" ]]; then
        echo "PASS     $SKILL_NAME — $ACTUAL_VERSION"
        echo "PASS" >> /tmp/eos_validate_counts
    else
        echo "MISMATCH $SKILL_NAME — kernel expects $EXPECTED_VERSION, file has $ACTUAL_VERSION"
        echo "FAIL" >> /tmp/eos_validate_counts
    fi

    # Check kernel_compat
    COMPAT=$(grep -m1 '^kernel_compat:' "$SKILL_FILE" | sed 's/kernel_compat:\s*//' | tr -d '"' | xargs)
    if [[ -n "$COMPAT" && "$COMPAT" != "$KERNEL_VERSION" ]]; then
        echo "  WARN   kernel_compat is $COMPAT (kernel is $KERNEL_VERSION)"
    fi
done

echo ""
echo "---"

# Count results
if [[ -f /tmp/eos_validate_counts ]]; then
    PASS_COUNT=$(grep -c "PASS" /tmp/eos_validate_counts 2>/dev/null | tr -d '[:space:]' || echo "0")
    FAIL_COUNT=$(grep -c "FAIL" /tmp/eos_validate_counts 2>/dev/null | tr -d '[:space:]' || echo "0")
    MISSING_COUNT=$(grep -c "MISSING" /tmp/eos_validate_counts 2>/dev/null | tr -d '[:space:]' || echo "0")
    rm -f /tmp/eos_validate_counts
    echo "Results: ${PASS_COUNT} passed, ${FAIL_COUNT} mismatched, ${MISSING_COUNT} missing"

    if [[ "${FAIL_COUNT}" -gt 0 || "${MISSING_COUNT}" -gt 0 ]]; then
        exit 1
    fi
else
    echo "No skills checked."
fi
