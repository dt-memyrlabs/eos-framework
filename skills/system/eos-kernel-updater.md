---
name: eos-kernel-updater
version: v1.0.0
kernel_compat: "v20.2.0"
state: trigger-ready
description: Proposes CLAUDE.md kernel edits based on session outcomes. Tier 3 — requires user approval for every change.
trigger: session-end, explicit request ("update kernel", "propose kernel change", "self-modify")
---

# EOS Kernel Updater

Analyzes session outcomes and proposes targeted CLAUDE.md edits. Never auto-edits. Every proposal requires explicit user approval (Tier 3).

## When to Trigger

- End of a substantive session (3+ exchanges with goal-locked work)
- User explicitly asks: "update kernel", "propose kernel change", "self-modify", "what should change in EOS"
- After a session where the user corrected the same behavior twice (regression pattern detected)
- After a session where CCI-G never exceeded 50% (system underperformance signal)

## Step 1: Gather Evidence

Review the current session for:

1. **Corrections received** — user told you to do something differently. Each correction is a candidate for a kernel rule or generation target update.
2. **Position moves** — places where `pos:moved` appeared in the header. What argument caused the move? Is there a pattern?
3. **CCI-G trajectory** — did it rise steadily or stall? If stalled, what was blocking?
4. **Sim-depth mismatches** — were you operating at the wrong depth for the task? Did the user have to ask for deeper simulation?
5. **Attractor basin failures** — did you default to conventional output when user context should have dominated?
6. **Rule conflicts** — did any rules contradict each other during this session?
7. **Memory gaps** — did you lack context that should have been in the USER MODEL?

## Step 2: Classify Proposals

For each piece of evidence, classify:

- **RULE_ADD** — new rule or sub-rule needed (evidence: same correction twice, or gap with no existing coverage)
- **RULE_MODIFY** — existing rule needs adjustment (evidence: rule fired but produced wrong behavior)
- **PARAM_CHANGE** — runtime parameter default needs updating (evidence: user consistently overrides a default)
- **IDENTITY_UPDATE** — generation target needs adding or modifying (evidence: output pattern consistently misaligned)
- **USER_MODEL_UPDATE** — USER MODEL template needs new field (evidence: repeated context gap)
- **NO_CHANGE** — evidence doesn't warrant kernel modification (most common outcome)

## Step 3: Generate Proposals

For each non-NO_CHANGE classification, produce a proposal in this exact format:

```
KERNEL UPDATE PROPOSAL [X of N]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type:     [RULE_ADD | RULE_MODIFY | PARAM_CHANGE | IDENTITY_UPDATE | USER_MODEL_UPDATE]
Section:  [exact section name in CLAUDE.md, e.g. "Rule 2: Generation Frame"]
Line:     [approximate line number or "after line X"]

Current:  [what exists now — quote the relevant text, or "nothing" for additions]

Proposed: [exact text to add or replace]

Basis:    [specific evidence from this session — quote the correction, the miss, the pattern]

Risk:     [LOW | MEDIUM | HIGH]
          [one line explaining what could go wrong if this change is applied]

Impact:   [which other rules or behaviors this interacts with]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVE / REJECT / MODIFY?
```

## Step 4: Present to User

- Present proposals one at a time
- Wait for APPROVE / REJECT / MODIFY on each before proceeding to the next
- On APPROVE: apply the edit to CLAUDE.md immediately
- On REJECT: log the rejection reason (for future reference — avoid re-proposing rejected changes)
- On MODIFY: incorporate user's modification, present the revised proposal for re-approval

## Step 5: Log

After all proposals are processed, write to Notion (if available):

```
Kernel Update Session: [timestamp]
Proposals: [N total]
Approved: [count]
Rejected: [count]
Modified: [count]
Changes applied: [list of section + change type]
```

## Constraints

- **Never auto-edit.** This is Tier 3. Every change requires explicit user approval in the chat.
- **Never propose changes to LOCKED VARIABLES** (compression prohibition, token ordering) unless the user explicitly requests it.
- **Never propose removing a named behavior** without documenting what absorbs its function (compression audit protocol).
- **Maximum 5 proposals per session.** More than 5 suggests systemic issues that need discussion, not incremental patches.
- **Version bump:** If any proposal is approved, bump the kernel patch version (e.g., v20.1.0 → v20.1.1) and update the date.
- **Rejected proposals are remembered.** If a user rejects a proposal, do not re-propose substantially similar changes in future sessions unless new evidence emerges.

## Anti-patterns

- Proposing vague rules ("be more careful") — every rule must be specific and testable
- Proposing rules that duplicate existing coverage — check first
- Proposing changes based on a single data point — minimum 2 instances of the same pattern
- Proposing changes that increase kernel size without clear value — Lean applies to the kernel itself
