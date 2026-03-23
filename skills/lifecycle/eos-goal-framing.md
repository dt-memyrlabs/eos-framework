---
name: eos-goal-framing
version: "v1.2.0"
kernel_compat: "v20.2.0"
state: trigger-ready
description: "Goal extraction, verification, feasibility thesis, and frame testing. Triggers when the user engages in goal-related discussion, when a project is loaded with CCI-G below 50%, when a goal is not yet locked, or when the user is exploring what they want to achieve. Also triggers when the user describes a problem without a clear goal — the skill extracts the goal from the problem. Triggers on phrases like 'I want to build', 'the objective is', 'what I'm trying to do', 'how do I achieve', or any discussion about outcomes, targets, or direction. Do NOT trigger when goal is already locked and CCI-G is above 50% — that's Project Management territory."
---

# Module B: Goal Framing

**Trigger:** Goal-related discussion, project with CCI-G < 50%, or goal not locked.
**Deactivates:** When CCI-G ≥ 50% AND goal is locked → hands off to `eos-project-mgmt`.
**Kernel rules in play:** Rule 1 (Goal Lock), Rule 2 (Generation Frame), Rule 3 (CCI), Rule 8 (Operational Empathy). Identity block governs tone and language.

---

## Steps

### B1. Scaffolded Entry
Use Operational Empathy (Rule 8) to extract:
- **Current state:** Where is the user right now?
- **Causation:** What led them here?
- **Concern:** What's at risk or at stake?

Do not ask abstract questions. Get specific. If they say "I want to build X," ask what they have already, not what their vision is.

### B2. Goal Verification
Ensure goal is:
- Explicit (not vague, not multi-goal)
- Confirmed by the user ("yes, that's the goal")

If ambiguous, nothing else starts (Rule 1). Push for specificity.

Write goal lock via `create_pieces_memory` (Tier A) or note in conversation (Tier B). Critical state — written immediately.

### B2b. Feasibility Thesis Extraction

**This is not optional and not passive.**

Once goal is stated, actively ask: *What is your belief about why this goal is achievable? What conditions, capabilities, advantages, or reasoning make you think this works?*

**Purpose:** The feasibility thesis is the primary alignment signal. It tells simulation which rules, constraints, and modules carry the most weight for this specific goal.

**Process:**
1. Ask directly.
2. Dig into the answer. Don't accept "because I think it'll work."
3. Decompose the thesis into discrete assumptions.
4. Log each assumption: `source: feasibility-thesis | status: open`.

**CCI impact:**

- **CCI-F (Framework Readiness):** Thesis status contributes to CCI-F. CCI-F is checked at session start only (not per-response). Thesis extracted = full credit. Deferred = partial. Not asked = zero.

- **CCI-G (Goal Progress):** Thesis *assumptions* (the decomposed beliefs) are a CCI-G dimension.
  - CCI-G cannot reach 100% while thesis-derived assumptions remain open/unvalidated.
  - **Action:** Log each assumption, track validation status, update CCI-G as assumptions resolve.

**Routing function:** Once extracted, the thesis orients Rule 2 (Simulation):
- Thesis rests on market timing → simulation prioritises external conditions, time-sensitivity.
- Thesis rests on capability advantage → simulation prioritises constraint validation, blocker protocol.
- Thesis rests on relationship/access → simulation prioritises collaboration, dependency mapping.

The thesis doesn't replace simulation — it focuses it.

**Goal locking:** Thesis does NOT gate goal locking. Goal locks on clarity and confirmation.

**Deferred thesis:** If user can't articulate yet:
- Log `feasibility thesis: deferred` as open thread.
- CCI-F gets partial credit (orientation attempted, result pending).
- Simulation runs unweighted (all rules at equal priority).
- Revisit when context develops.

### B3. Frame Hypothesis
Treat the user's initial frame as a hypothesis. Simulate it against the goal (not against convention):
- Does this frame serve the goal?
- Does it add complexity without value?
- Is there a simpler frame that achieves the same goal?

If frame adds waste, propose simplification. If frame survives simulation, say so.

### B4. Constraint Identification
Identify immediate constraints. Classify per Rule 2:
- **Hard:** evidence required.
- **Structural:** revisitable.
- **Assumed:** challenge target.

Log in Pieces memory (Tier A) or conversation (Tier B).

### B5. Assumption Logging
Log all assumptions surfaced during framing:
- From user statements
- From simulation findings
- From feasibility thesis decomposition (B2b)

Format: `[assumption] | source: [user/simulation/feasibility-thesis] | status: open | [date]`

### B6. CCI Update
Reassess CCI-G (CCI-F is session-start only — not reassessed during goal framing):

**CCI-G:**
- Goal clarity (locked or not)
- Inputs resolved
- Outputs defined
- Blockers identified
- Convergence distance
- Thesis assumptions status (open/validated/invalidated)

### B7. Transition Check
If CCI-G ≥ 50% AND goal is locked:
- Goal Framing deactivates.
- `eos-project-mgmt` becomes active on next relevant interaction.
- State the transition explicitly to the user.
