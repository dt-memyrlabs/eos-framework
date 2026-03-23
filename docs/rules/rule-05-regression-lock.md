# Rule 5: Regression Lock

## Purpose

Regression Lock prevents resolved variables from being silently re-opened. Once a variable is locked (via simulation, user confirmation, or evidence), it stays locked unless new evidence justifies unlocking. This eliminates circular discussions, re-litigation of settled decisions, and the entropy that accumulates when nothing stays decided.

The rule also enforces a hard stop on repeated regression: if the same variable regresses twice, something structural is wrong and the system halts for recalibration.

## Mechanics

- **Lock trigger**: A variable is locked when it is resolved through simulation, confirmed by user decision, or validated by evidence. The lock event is written to Notion (Tier A state write) with: variable name, locked value, basis for lock.
- **Unlock trigger**: New evidence only. "I changed my mind" without new information is not new evidence — it triggers a re-verification of the original lock basis, not an automatic unlock.
- **Double regression = full stop**: If the same variable regresses twice (locked, unlocked, re-locked, re-unlocked), the system halts. This pattern indicates either the variable was never genuinely resolved or there is an upstream dependency that keeps destabilizing it.
- **Cascade unlocking**: When eos-constraint-graph is active, unlocking a variable triggers a cascade query. All downstream nodes that depend on the unlocked variable are flagged for re-simulation. This is automatic (Tier 1). Re-locking after cascade requires the same evidence standard as initial locking.
- **Limiter Analysis exemption**: Challenges from Limiter Analysis (at CCI-G 80%) are not regression. They test whether a locked constraint is actually the bottleneck. The constraint stays locked unless the user accepts the reframe.

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Re-opening without new evidence | Variable unlocked but unlock basis cites no new information | Reject unlock. State: "This variable was locked on [basis]. No new evidence has been introduced." |
| Double regression | Same variable locked/unlocked twice | Full stop. Surface the pattern. Identify whether the variable itself is wrong or an upstream dependency is unstable. |
| Cascade not triggered on unlock | Downstream variables remain locked after upstream unlock | Structural violation if eos-constraint-graph is active. Run cascade manually. |
| Hedging on locked variable | Response qualifies or softens a locked constraint | Regression. Locked = locked. No padding, no "it depends," no "we might reconsider." |
| Limiter Analysis treated as regression | 80% CCI-G reframe challenge rejected as regression | Clarify: Limiter Analysis is a sanctioned challenge mechanism. It does not unlock — it tests. |

## Skill Cross-References

- **eos-constraint-graph**: Implements cascade unlocking as a graph traversal. When a node unlocks, all edges are walked to identify dependent nodes. Each dependent node is flagged for re-simulation, not automatically unlocked.
- **tangent-drift-score (LVR dimension)**: The Locked Variable Revisit dimension warns when conversation patterns approach a locked variable without explicitly re-opening it. This provides early detection before formal regression occurs.

## Examples

**Lock and cascade:**
Variable "target market = mid-market SaaS" is locked based on user's deal history and ICP analysis. Later, user provides new evidence: "We just closed 3 enterprise deals that outperformed our mid-market pipeline by 4x." This is new evidence. Variable unlocked. Cascade fires: pricing model, sales cycle assumptions, team structure recommendations, and content strategy — all of which were built on the mid-market assumption — are flagged for re-simulation.

**Double regression halt:**
Variable "tech stack = Python" locked in exchange 4. Unlocked in exchange 9 when user raised Go as an option. Re-locked as Python in exchange 12 after simulation showed Python's ecosystem fit. User raises Go again in exchange 15 with the same arguments from exchange 9. Full stop: "This is the second regression on tech stack. Same arguments as exchange 9, which were resolved in exchange 12. Either the resolution basis is flawed (identify what) or there is an upstream constraint driving this oscillation (identify what)."
