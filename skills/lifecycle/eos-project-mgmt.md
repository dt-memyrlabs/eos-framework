---
name: eos-project-mgmt
version: "v1.1.1"
kernel_compat: "v20.4.0"
state: trigger-ready
description: "Full project management: assumption tracking, decision logging, blocker management, limiter analysis, convergence. Triggers when a project has a locked goal AND CCI-G is at or above 50%. Stays active while the project is being discussed. Also triggers when the user references an active project by name, asks about project status, discusses blockers, makes decisions that need tracking, or works toward convergence. Handles cross-project priority conflicts when multiple projects are active. Do NOT trigger during initial goal framing (that's eos-goal-framing) or pure build execution (that's eos-builder)."
---

# Module C: Project Management

**Trigger:** Goal locked AND CCI-G ≥ 50%.
**Stays active** while project is being discussed.
**Kernel rules in play:** All core rules (1-10). Rule 2 is now Generation Frame (not Continuous Simulation). This is the heaviest module.

---

## C1. Assumption Registry
All assumptions logged with: assumption, source, status (open/validated/invalidated), date.

Validation methods:
- Evidence (data, test result, external confirmation)
- Outcome (the thing happened or didn't)
- User confirmation (user verifies from domain knowledge)

Invalidated assumption → re-simulation of all dependent threads.

Feasibility thesis assumptions (source: `feasibility-thesis`) carry no special weight — same evidence standards as any other assumption.

## C2. Decision Reversibility
Every decision tagged:
- **R (Reversible):** Can be undone with manageable cost.
- **I (Irreversible):** Cannot be undone, or reversal cost is severe.

**I-tagged decisions require:**
- Two failure modes tested
- User confirmation (per Tier 3)
- Rollback consideration logged

Format: `[decision] | I | [rationale] | failure modes: [1], [2] | rollback: [consideration]`

I-tagged decisions are written to Pieces LTM via `create_pieces_memory` (Tier A) or noted inline (Tier B).

## C3. External Blocker Protocol
Log blockers:
- Description
- Affected threads
- Owner (who resolves it)
- Status (open/resolved)
- Date

**Stale blocker rule:** If a blocker is still open when a project is resumed (detected via `ask_pieces_ltm` or conversation history), flag it. Don't let blockers sit quietly.

Resolution → reactivate all affected threads.

## C4. Cross-Project Priority
When resources or time conflict between projects:
- Higher priority project wins by default.
- Hard deadline conflicts flagged regardless of rank.
- User decides override (logged as I decision).

Priority is tracked per project in Pieces memory or Notion if the user has set it up.

## C5. Outcome Feedback Loop
When a decision or build is deployed, log:
- Predicted outcome (what simulation expected)
- Actual outcome (what happened)
- Calibration: match or mismatch

**Pattern detection:**
- 2 mismatches of same type → propose amendment to approach
- 3 mismatches of same type → mandatory amendment

## C6. User Behavior Protocol
Monitor for (flag once per session, no more):
- Rapid sequential overrides (user overriding multiple simulation recommendations without engagement)
- Simulation bypass (user proceeding without letting simulation run)
- Blocker avoidance (user routing around blockers instead of resolving them)
- Unlogged overrides (user making decisions that aren't getting tracked)

First occurrence: Tier 2 (notify).
Persistent pattern: escalate to Tier 3.

## C7. Limiter Analysis
**Auto-triggers at CCI-G 80%.**

Process:
1. Enumerate all remaining constraints preventing convergence.
2. Classify each (Hard/Structural/Assumed).
3. Challenge Assumed and Structural constraints with specific reframes.
4. Respect Hard constraints (evidence verified).
5. Score reframes by goal-distance impact.
6. Present per autonomy tiers.
7. User veto available for Tier 2/3 reframes.

**Veto Immunity Clause:** If user vetoes a reframe on a specific variable:
- Instantly promoted to Hard constraint.
- Immune to further automatic C7 challenges.
- Only re-openable by user explicit instruction (per Rule 7), treated as Structural for that pass.

## C8. Convergence Declaration
Conditions:
- Simulation passes without meaningful improvement possible.
- Remaining limiters are all Hard with verified evidence.
- CCI-G is at or near 100%.

I declare convergence. User validates.

## C9. Termination
- Goal met and user confirms, OR
- Both agree unknowables require committing (ship it).

Log final state via `create_pieces_memory` (Tier A). Archive project in Notion/Jira if configured.

## C10. Parallel Trajectory Development

**Trigger:** Rule 2 trajectory enumeration produces 2-3 surviving trajectories that share 2+ common variables.

**Purpose:** Develop surviving trajectories concurrently as structured parallel blocks instead of sequential prose. Reduces first-path bias by ensuring each trajectory receives equal development depth before comparison.

### C10.1: Parallel Block Format

When triggered, develop each trajectory using this structure:

```
### TRAJECTORY: [name]

**Core path:** [1-2 sentence description]
**Assumptions:** [numbered list — each with falsification criterion]
**Constraint satisfaction:** [which Hard/Structural constraints it meets]
**Waste score:** [number of steps, dependencies, or components that could be removed without degrading outcome]
**Cascade risk:** [if constraint graph active: what breaks if this path's key assumption fails]
**Open variables:** [what remains unresolved on this path]
```

All trajectories developed to the same depth. No trajectory gets a second pass before all have had their first.

### C10.2: Checkpoint Comparison

After parallel blocks are complete, compare on these dimensions:

| Dimension | Metric |
|---|---|
| Assumption count | Fewer = better (integrated into Generation Frame) |
| Constraint satisfaction | More Hard constraints met = better |
| Waste score | Lower = better (integrated into Identity Lean Thinking) |
| Cascade risk | Lower blast radius = better |
| Open variables | Fewer = closer to convergence |

Score each trajectory. Recommend the leader with explicit reasoning. Present for user moderation per standard Recommendation and Moderation Protocol.

### C10.3: Sequential Fallback

Parallel development is NOT required when:
- Only 1 trajectory survives initial simulation (no comparison needed).
- Surviving trajectories share fewer than 2 common variables (comparison dimensions are too different for structured parallel blocks to add value).
- Context pressure (Rule 9 >70%) makes parallel blocks wasteful.

In these cases, sequential development per existing Rule 2 trajectory enumeration applies.

### C10.4: Constraint Graph Integration

When `eos-constraint-graph` is active:
- Each trajectory's assumptions and decisions are modeled as provisional graph nodes (not yet locked).
- Cascade risk is computed from the provisional graph — "if this path's key assumption fails, N downstream nodes are affected."
- On trajectory selection, provisional nodes for the chosen path are promoted to locked. Provisional nodes for rejected paths are discarded.

---

### C10 Cross-References

- **Kernel Rule 2 (Trajectory Enumeration):** C10 is the implementation of parallel trajectory development referenced in Rule 2.
- **Kernel Rule 2 (Occam's Razor):** Assumption count is a primary comparison dimension (C10.2).
- **Kernel Rule 2 (Lean Test):** Waste score is a primary comparison dimension (C10.2).
- **eos-constraint-graph:** Provisional graph nodes (C10.4) enable cascade risk analysis before commitment.
- **eos-contradiction:** If user rejects the C10 recommendation, contradiction skill handles re-enumeration.
