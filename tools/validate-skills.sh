#!/bin/bash
# EOS Skill Validator (v22-aware)
# Checks each skill's YAML frontmatter, compares kernel_compat against the
# kernel's major version, and flags references to machinery retired in v22.
# Exits 0 with a summary (warnings are informational — skills are optional
# extensions since v22); exits 1 only on structural problems (missing
# frontmatter fields or unreadable kernel).
# Usage: ./tools/validate-skills.sh [kernel_path] [skills_dir]

set -u

KERNEL="${1:-kernel/CLAUDE.md}"
SKILLS_DIR="${2:-skills}"

if [[ ! -f "$KERNEL" ]]; then
    echo "ERROR: kernel not found at $KERNEL"
    exit 1
fi

KERNEL_VERSION=$(head -1 "$KERNEL" | grep -oE 'v[0-9]+(\.[0-9]+)*' | head -1)
KERNEL_MAJOR=$(echo "${KERNEL_VERSION:-v0}" | grep -oE '[0-9]+' | head -1)
echo "Kernel: ${KERNEL_VERSION:-unknown} (major ${KERNEL_MAJOR:-?})"
echo "---"

RETIRED_PATTERN='CCI-G|Context Lens|sim-depth|sim-d:|\[tds|\[ltm|Rule 8|Rule 9|Rule 10'
OK=0; LEGACY=0; STRUCTURAL=0

for f in "$SKILLS_DIR"/*/*.md; do
    name=$(grep -m1 '^name:' "$f" | sed 's/^name:[[:space:]]*//')
    compat=$(grep -m1 '^kernel_compat:' "$f" | sed 's/^kernel_compat:[[:space:]]*//; s/"//g')
    if [[ -z "$name" || -z "$compat" ]]; then
        echo "STRUCTURAL  $f — missing name or kernel_compat in frontmatter"
        STRUCTURAL=$((STRUCTURAL + 1))
        continue
    fi
    compat_major=$(echo "$compat" | grep -oE '[0-9]+' | head -1)
    issues=""
    [[ "$compat_major" != "$KERNEL_MAJOR" ]] && issues="kernel_compat $compat != kernel $KERNEL_VERSION"
    if grep -qE "$RETIRED_PATTERN" "$f"; then
        [[ -n "$issues" ]] && issues="$issues; "
        issues="${issues}references v21-retired machinery"
    fi
    if [[ -n "$issues" ]]; then
        marked=""
        grep -q 'v22 status: legacy' "$f" && marked=" [marked legacy]"
        echo "LEGACY      $name — $issues$marked"
        LEGACY=$((LEGACY + 1))
    else
        echo "OK          $name ($compat)"
        OK=$((OK + 1))
    fi
done

echo "---"
echo "Summary: $OK ok, $LEGACY legacy, $STRUCTURAL structural problems"
echo "Legacy skills still load as optional extensions; see docs/v22-behavior-map.md before relying on one."
[[ $STRUCTURAL -gt 0 ]] && exit 1
exit 0
