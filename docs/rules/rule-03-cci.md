# Rule 3: CCI (Complete Context Index)

## Purpose

CCI is a living health indicator, not a phase gate. It tracks two dimensions: whether the framework is operational (CCI-F) and how close the current engagement is to goal completion (CCI-G). CCI prevents false confidence — it drops when simulation reveals new unknowns, even if progress was made on known ones.

CCI also enforces input quality standards. Confirmed depth (interrogated, traced to lived experience) counts. Visible ceiling (surface-level observation accepted without probing) does not.

## Mechanics

- **CCI-F (Framework Readiness)**: Checked at session start only, not per-response. Tracks: persistence layer operational, relevant skills loaded, feasibility thesis state, drift check completed. Below 50% at session start = flag until resolved. This is infrastructure health — it does not fluctuate during a session.
- **CCI-G (Goal Progress)**: Percentage, tracked per-response in the runtime header. Components: goal clarity (locked or not), inputs resolved, outputs defined, blockers identified, convergence distance, feasibility thesis assumptions (open/validated/invalidated), USER MODEL specificity.
- **CCI-G cannot reach 100%** while thesis assumptions remain open. This prevents premature convergence.
- **Input quality caps CCI**: Surface-level input caps at medium confidence. Context-level input (traced to specific lived experience) is eligible for high. CCI cannot exceed the quality of its inputs.
- **Behavior thresholds**: Below 50% = flag low confidence. At 80% = Limiter Analysis triggers. At 100% with simulation passing = convergence candidate.
- **Sparse USER MODEL caps CCI-G**: If the USER MODEL lacks specificity, CCI-G reflects that gap regardless of other progress.

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| CCI-G inflated past input quality | High CCI-G but inputs are surface-level declarations | Cap CCI-G at medium. Flag: "CCI capped — inputs not traced to lived experience." |
| Premature convergence | CCI-G at 100% but thesis assumptions still open | Block convergence declaration. List open assumptions. |
| CCI-F not checked at session start | No framework readiness assessment in first response | Structural violation. Run CCI-F check before substantive output. |
| CCI-G stagnation | Same percentage across 3+ exchanges | Investigate: are new unknowns appearing at the same rate as resolutions? Is the goal actually locked? |
| Sparse USER MODEL ignored | CCI-G rises while USER MODEL fields are empty | Cap CCI-G. Specificity is displacement strength — sparse model means weak displacement. |
| Limiter Analysis skipped at 80% | CCI-G passes 80% without triggering | eos-project-mgmt should fire Limiter Analysis. If it does not, flag the skill state. |

## Skill Cross-References

- **eos-goal-framing**: Primary driver of CCI-G updates. As the feasibility thesis develops (dimensions locked, assumptions validated or invalidated), CCI-G moves. Thesis state is a direct CCI-G input.
- **eos-project-mgmt**: Owns Limiter Analysis, which triggers at CCI-G 80%. Limiter Analysis challenges accepted constraints to find the highest-leverage reframe for closing the remaining 20%.
- **eos-constraint-graph**: Graph health feeds CCI-G. Unresolved nodes, circular dependencies, and orphaned constraints all depress CCI-G. A clean graph with all nodes classified and connected is a CCI-G accelerator.
- **eos-memory-mgmt**: CCI-F depends on persistence layer detection (M1 hard gate). If Notion is down, CCI-F reflects degraded state.

## Examples

**CCI-G drop on new unknowns:**
CCI-G is at 65%. User reveals a regulatory constraint not previously discussed. CCI-G drops to 50% — a new input surfaced that was not in the model. Simulation must now account for regulatory requirements, which may invalidate one or more locked trajectories. The drop is correct behavior, not a failure.

**Input quality cap:**
User says "Our sales cycle is long." CCI-G for the sales-cycle input stays at medium. Probing for context: "How long specifically? What is the range across your last 10 deals? Where does it stall?" If user responds with "average 47 days, stalls at legal review in 8 of 10 cases," CCI-G for that input is eligible for high. The specificity of the second answer displaces the vagueness of the first.
