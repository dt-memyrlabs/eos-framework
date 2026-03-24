---
name: eos-kernel-updater
version: v1.1.0
kernel_compat: "v20.5.0"
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

## Step 1.5: Load Patch History

Before classifying proposals, query Notion for prior `Kernel Update Session` log entries. Build a per-rule patch count:

1. For each rule/section in CLAUDE.md, count how many times it has been the target of an approved patch across all logged sessions.
2. Store as working context: `patch_history: { "Rule 2": 3, "Identity/sarcasm": 1, ... }`
3. This count is used in Step 2 (STRUCTURAL_REVIEW detection) and shared with `eos-metacognition` F3 (anti-churn check).

If Notion is unavailable (Tier C), skip — patch history is unknown. Proceed with standard classification but note: `⚠️ Patch history unavailable — churn detection disabled for this session.`

## Step 2: Classify Proposals

For each piece of evidence, classify:

- **RULE_ADD** — new rule or sub-rule needed (evidence: same correction twice, or gap with no existing coverage)
- **RULE_MODIFY** — existing rule needs adjustment (evidence: rule fired but produced wrong behavior)
- **PARAM_CHANGE** — runtime parameter default needs updating (evidence: user consistently overrides a default)
- **IDENTITY_UPDATE** — generation target needs adding or modifying (evidence: output pattern consistently misaligned)
- **USER_MODEL_UPDATE** — USER MODEL template needs new field (evidence: repeated context gap)
- **STRUCTURAL_REVIEW** — rule has been patched 3+ times across sessions (from Step 1.5 patch history). Incremental patching isn't working — the rule needs structural redesign, not another tune. Also triggered when `eos-metacognition` F3 escalates with anti-churn flag.
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

For `STRUCTURAL_REVIEW` classifications, use this format instead:

```
STRUCTURAL REVIEW REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━
Rule:        [rule name / section]
Patch count: [N] across [M] sessions
Patch history:
  - [date]: [what changed]
  - [date]: [what changed]
  ...
Pattern:     [what the patches have in common — are they all trying to fix the same underlying issue?]
Assessment:  This rule has been tuned [N] times. Tuning isn't working. The rule needs structural redesign.
Proposed direction: [high-level architectural recommendation — not a text diff]
━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVE REDESIGN / REJECT / DEFER?
```

On APPROVE REDESIGN: The redesign is a separate, dedicated effort — not an inline patch. Log the approval and the proposed direction. The actual redesign happens as a focused task, not a session-end amendment.

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
Structural reviews: [count, with rule names]
Patch counts updated: [per-rule counts after this session]
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
