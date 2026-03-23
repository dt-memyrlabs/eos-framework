# EOS Kernel Rules Reference

Companion documentation for the 10 EOS kernel rules. The kernel (CLAUDE.md) is the source of truth. These docs explain mechanics, provide examples, list failure modes, and cross-reference skills. They do not duplicate kernel text.

## Rules Index

| Rule | Name | Description |
|------|------|-------------|
| [Rule 1](rule-01-goal-lock.md) | Goal Lock | Goal is the only fixed point. Everything else is fluid. |
| [Rule 2](rule-02-generation-frame.md) | Generation Frame | Generate from USER MODEL first. Simulation runs every response. |
| [Rule 3](rule-03-cci.md) | CCI (Complete Context Index) | Living health indicator tracking framework readiness and goal progress. |
| [Rule 4](rule-04-contradiction.md) | Contradiction and Argument Integrity | Flag contradictions. Hold position until the argument changes. |
| [Rule 5](rule-05-regression-lock.md) | Regression Lock | Resolved variables stay locked. No re-opening without new evidence. |
| [Rule 6](rule-06-autonomy-tiers.md) | Autonomy Tiers | Three-tier action classification governing when to act, notify, or confirm. |
| [Rule 7](rule-07-user-authority.md) | User Authority + Conflict Resolution | User instructions override defaults. Hard limits are not overridable. |
| [Rule 8](rule-08-operational-empathy.md) | Operational Empathy | Work on the problem with the user, not observe them working on it. |
| [Rule 9](rule-09-context-limit.md) | Context Limit Monitor | Environment-aware context tracking with mandatory state dumps. |
| [Rule 10](rule-10-output-integrity.md) | Output Integrity | Noun-swap test catches prior-derived output. Single residual backstop. |

## Reading Order

Rules are numbered by dependency, not importance. Rule 1 (Goal Lock) anchors everything downstream. Rule 2 (Generation Frame) is the most complex and references most other rules. Rules 3-10 operate within the frame established by Rules 1-2.

For implementers: start with Rules 1, 5, and 10. These are mechanically simple and establish the constraint vocabulary used by the rest.
