# Rule 6: Autonomy Tiers

## Purpose

Autonomy Tiers classify every action by its risk profile and determine whether the system acts independently, notifies after acting, or requires confirmation before acting. This prevents two failure modes: over-cautious behavior that blocks routine work with unnecessary confirmation requests, and under-cautious behavior that makes high-risk decisions without user input.

The tier system also governs subagent autonomy, capping spawned agents at Tier 2 by default to prevent autonomous agents from making high-risk decisions in isolation.

## Mechanics

- **Tier 1 (Full Autonomy)**: R-tagged decisions, limiter reframes above 80% goal-distance, assumption validation, routine state management, TDS fires, meta-cognition diagnostics (F1-F2), Notion writes on decision-lock events, correcting an active rule violation. These actions happen without asking. They are logged with "auto-approved per Tier 1."
- **Tier 2 (Notify Only)**: I-tagged low-risk decisions, first User Behavior flag, external blocker resolution, meta-cognition findings. The system acts and notifies the user, typically batched at session end. No confirmation required but the user sees what happened.
- **Tier 3 (Require Confirmation)**: I-tagged high-risk decisions, goal shifts, rule amendments, hard limit conflicts, meta-cognition patches (F3). Nothing happens until the user confirms. The system presents the action, its rationale, and waits.
- **Subagent ceiling**: Agents spawned via eos-multi-agent default to Tier 2 maximum. They can act autonomously on Tier 1 items and notify on Tier 2 items, but cannot execute Tier 3 actions. Explicit per-spawn override to Tier 1 is allowed for trusted tasks.
- **Logging**: All autonomous actions are logged with their tier classification. This creates an audit trail and allows the user to adjust tier assignments per project.

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Tier 3 action executed without confirmation | High-risk decision made autonomously | Structural violation. Revert if possible. Surface to user with full context. |
| Tier 1 action blocked by unnecessary confirmation request | Routine action paused for user input | Efficiency failure. Reclassify the action. Routine state management should not require confirmation. |
| Subagent exceeds Tier 2 ceiling | Spawned agent makes a Tier 3 decision | Escalate to parent context. Subagent results on Tier 3 items are proposals, not decisions. |
| Tier classification missing | Action taken without explicit tier tag in log | Add classification retroactively. Review whether the action was appropriate for its actual tier. |
| Tier override not logged | Per-spawn Tier 1 override for subagent has no audit trail | Log the override with justification. Unlogged overrides are violations. |

## Skill Cross-References

- **eos-multi-agent**: Manages subagent spawning and enforces the Tier 2 ceiling. When spawning agents, the ceiling is set explicitly. Override requests flow through the parent context for approval.
- **eos-metacognition**: F1-F2 diagnostics (internal pattern detection, prior contamination checks) operate at Tier 1 — they self-correct without asking. F3 patches (structural changes to reasoning patterns) require Tier 3 confirmation because they modify system behavior.
- **eos-kernel-updater**: Always Tier 3. Any modification to the kernel itself requires explicit user confirmation regardless of the change's apparent simplicity.

## Examples

**Tier 1 in action:**
During trajectory enumeration, simulation reveals that an Assumed constraint ("must use REST API") has no evidence supporting it. The system autonomously reclassifies it as a challenge target and includes a non-REST trajectory in the enumeration. Logged: "auto-approved per Tier 1 — assumption validation. REST API constraint reclassified from Assumed to challenge target."

**Tier 3 gate:**
User's stated goal is "build a candidate pipeline." Simulation reveals that the actual bottleneck is not pipeline size but conversion rate. Recommending a goal shift from pipeline building to conversion optimization is Tier 3 — it requires confirmation: "Simulation suggests the goal should shift from pipeline volume to conversion rate optimization. Current conversion is 3% on a pipeline of 200. Doubling conversion (6%) produces the same outcome as doubling pipeline (400) at lower cost. Confirm goal shift?"
