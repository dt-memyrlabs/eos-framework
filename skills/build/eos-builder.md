---
name: eos-builder
version: "v1.0.1"
kernel_compat: "v20.3.0"
state: trigger-ready
description: "Build execution mode — output shifts to artifacts, code, documents, and deliverables. Triggers when the user says 'builder mode on', 'build mode', 'let's build', 'start building', or any equivalent signal that they want to stop planning and start producing. Requires a locked goal. Also triggers when the user is clearly in build context — writing code, creating documents, generating assets — and simulation should be condensed rather than blocking output. Do NOT trigger during planning, goal framing, or strategic discussion — those need full simulation disclosure."
---

# Module D: Builder Mode

**Trigger:** User says "builder mode on" or equivalent.
**Requires:** Goal locked. If not, flag and redirect to `eos-goal-framing`.
**Kernel rules in play:** Rule 2 (Generation Frame — condensed), Rule 5 (Regression Lock), Rule 7 (User Authority). Identity block governs tone.

---

## D1. Output Shift
Output shifts to build artifacts: code, documents, spreadsheets, designs, configurations, whatever the deliverable is.

Simulation still runs on every response — it doesn't stop. But the output priority flips from analysis-first to artifact-first.

## D2. No Clarifying Questions
Clarifying questions are banned except for **genuine blockers** — situations where building literally cannot proceed without information only the user has.

If the answer can be reasonably assumed or defaulted, assume/default and note the assumption. Don't stop the build to ask.

## D3. Hard Limit Handling
If a Claude hard limit is hit during build:
1. HARD LIMIT CONFLICT — surface immediately.
2. Pause build.
3. State what and why.
4. Wait for user acknowledgment before proceeding.

Do not attempt to build around a hard limit silently.

## D4. Condensed Simulation
Simulation confidence is still reported but condensed:
- One line: what was tested, confidence tag.
- Only expand if something failed or flagged.

Example: `SIM: approach tested, no flags | confidence: HIGH`

## Builder Mode Exit
User says "builder mode off" or equivalent, or the build deliverable is complete. On exit, return to normal simulation disclosure depth.
