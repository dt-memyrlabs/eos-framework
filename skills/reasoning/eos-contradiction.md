---
name: eos-contradiction
version: "v1.1.0"
kernel_compat: "v20.4.0"
state: trigger-ready
description: >
  Trajectory-aware contradiction handling. Fires when the user disagrees with
  a recommended path, rejects a trajectory survivor, or challenges the basis
  for a recommendation. Tracks which trajectory/branch is contested, documents
  the contradiction with full context, explores alternatives, and re-enters
  trajectory enumeration incorporating feedback. Maintains contradiction
  history within the session so rejected paths and their rejection basis are
  available to downstream simulation. Cross-references Rule 4 for position
  integrity throughout.
---

# EOS Contradiction Skill — Trajectory-Aware Disagreement Resolution

## Trigger

- User rejects a recommended trajectory (explicit: "no," "not that," "I disagree"; implicit: proposes alternative without accepting recommendation).
- User modifies a recommendation in a way that changes the trajectory's structural assumptions.
- User challenges the basis for why a trajectory was recommended over survivors.
- User challenges why a trajectory was killed during enumeration.

Do NOT trigger on:
- General contradiction between user statements (Rule 4 handles directly).
- Agreement or acceptance of recommendation (no contradiction exists).
- Clarifying questions about a recommendation (not yet disagreement).

## Autonomy

- Tier 1: Contradiction documentation, history tracking, alternative exploration.
- Tier 2: Notify when re-entering trajectory enumeration (user already triggered it by disagreeing).
- Tier 3: If contradiction reveals a goal-level conflict (not trajectory-level), escalate — this may be a Rule 1 goal shift, not a path disagreement.

---

## C1: Contradiction Capture

When triggered, capture immediately:

| Field | Content |
|---|---|
| **Contested trajectory** | Name/description of the recommended path being rejected or modified |
| **User's objection** | The specific argument — what fails, what's wrong, what's missing |
| **Objection type** | `reject` (kill this path) / `modify` (change this path) / `challenge-basis` (explain why this over alternatives) / `resurrect` (reopen a killed path) |
| **Current survivors** | List of trajectories still alive at the point of contradiction |
| **Recommendation basis** | Why this trajectory was recommended (from the original recommendation) |

This capture is the input to C2. It ensures the system understands WHICH branch is contested and WHY before responding.

---

## C2: Position Check (Rule 4 Cross-Reference)

Before exploring alternatives, apply Rule 4 Position Integrity:

1. **Is the user's objection a new argument?** New evidence, new constraint, new failure mode the original simulation missed → concede, name what moved, proceed to C3.
2. **Is the user's objection pressure without new argument?** Restating preference, emotional weight, repetition of prior position → hold position, state why, present the specific simulation evidence that supports the recommendation. Do not re-enter enumeration on pressure alone.
3. **Is the objection ambiguous?** Cannot determine if new argument or pressure → ask one clarifying question targeting the distinction: "What does this path fail on that wasn't covered in the simulation?"

Document position outcome: `held | basis: [reason]` or `moved | basis: [what changed]`.

If held: user still owns shutdown signal. If they insist after hold, proceed to C3 with their direction — log as user override, not concession.

---

## C3: Alternative Exploration

When position moves (new argument) or user overrides after hold:

### C3.1: Context Injection

Load into working context:
- The full contradiction capture from C1
- Contradiction history (all prior rejections/modifications this session — see C5)
- Current trajectory survivors
- Any killed trajectories whose kill-basis is weakened by the new argument

### C3.2: Re-Enumeration

Re-enter Rule 2 trajectory enumeration with these modifications:

1. **Incorporate feedback as constraint.** The user's objection becomes a simulation input — either a new constraint (if reject/modify) or a re-evaluation trigger (if challenge-basis/resurrect).
2. **Do not re-present killed paths unless the new argument invalidates their kill-basis.** Contradiction history prevents zombie trajectories.
3. **Simulate all surviving trajectories (including any resurrected) against the updated constraint set.**
4. **Kill failures with documented reasoning.** Write to Notion on bilateral agreement or concession per Rule 4.
5. **Recommend the surviving path with fewest assumptions (Occam's Razor).** Include explicit reasoning for why this recommendation differs from the previous one (or why it's the same path with modifications).

### C3.3: Present Recommendation

New recommendation follows the standard Recommendation and Moderation Protocol:
- Documented reasoning
- Request user moderation
- If rejected again → loop back to C1 (new contradiction capture)

---

## C4: Escalation Detection

During C2 or C3, if the contradiction reveals any of these, escalate out of this skill:

| Signal | Escalation |
|---|---|
| Objection targets the goal itself, not the path | → Rule 1 Goal Lock verification. Possible goal shift — Tier 3. |
| Objection reveals a new hard constraint not in the constraint registry | → Rule 2 constraint classification. Promote before re-enumeration. |
| Same trajectory rejected 3+ times with different arguments each time | → Flag: possible frame mismatch. The trajectories may be correct but the frame is wrong. Probe frame before continuing enumeration. |
| User and system are locked in position (held 2+ rounds, no new arguments from either side) | → Rule 4 shutdown signal check. Ask: "Are we circling? Should I proceed with your preferred path and flag my concerns as assumptions?" |

---

## C5: Contradiction History

Maintain within the session (persists in working context, written to Notion Spoke under `DECISIONS MADE` with `CONTESTED` tag on resolution):

```
## CONTRADICTION HISTORY
| # | trajectory | objection_type | objection | position | outcome | exchange |
|---|-----------|----------------|-----------|----------|---------|----------|
```

Fields:
- **trajectory**: which path was contested
- **objection_type**: reject / modify / challenge-basis / resurrect
- **objection**: one-line summary of the argument
- **position**: held / moved / user-override
- **outcome**: what happened (re-enumerated / modified path / user proceeded with override / escalated)
- **exchange**: when it happened

This history serves two functions:
1. Prevents re-presentation of paths whose kill-basis still holds.
2. Provides simulation input — patterns in contradictions reveal the user's actual (possibly unstated) constraints.

After 3+ entries, scan for patterns and surface: "Your rejections of X, Y, Z share [common thread]. Is [inferred constraint] the actual constraint we should be working with?"

---

## C7: Contradiction Pattern Mining (Tier 1 — autonomous)

**Trigger:** Contradiction history (C5) reaches 3+ entries. Runs automatically after each new C5 entry once threshold is met.

**Purpose:** The C5 section notes that patterns should be surfaced after 3+ entries. C7 is the mechanism. It extracts hidden constraints — the unstated rules the user is actually operating under, revealed by what they consistently reject.

### C7.1: Pattern Extraction

Scan contradiction history for recurring rejection signatures:

| Pattern Type | Detection | Example |
|---|---|---|
| **Common constraint** | 2+ rejections share the same objection dimension (cost, timeline, complexity, team capability) | Rejected path A for cost, rejected path C for cost → cost ceiling is an unstated hard constraint |
| **Common survivor** | Same trajectory type consistently survives while others are killed | User always keeps the path with least external dependency → autonomy is a hidden constraint |
| **Escalation consistency** | Challenge-basis objections cluster around the same evaluation criterion | User repeatedly asks "why not X over Y" with X always being the simpler option → complexity aversion is structural, not incidental |
| **Override clustering** | User overrides cluster in the same domain (technical, process, people, timeline) | 3 overrides all in "people" domain → user has people-context the model lacks |

### C7.2: Constraint Inference

For each detected pattern:

1. **Formulate the hidden constraint:** State it as a falsifiable proposition. "Based on rejections [list], the operating constraint appears to be: [constraint]."
2. **Classify:** Propose classification (Hard/Structural/Assumed) based on the consistency and strength of the rejection pattern.
3. **Present for validation:** Surface to user: `Pattern detected in contradiction history: [pattern]. Inferred constraint: [constraint]. Should this be promoted to [classification] in the constraint registry?`
4. **On confirmation:** Add to constraint graph (if active) via G2.1. Add to Notion Spoke CONSTRAINT REGISTRY. Future trajectory enumeration incorporates this constraint from the start — no more wasted cycles on paths that violate it.
5. **On rejection:** Log as "pattern noted, constraint not confirmed." Do not re-surface the same pattern unless new evidence strengthens it (2+ additional rejections in the same dimension).

### C7.3: Feedback Loop

Mined constraints that are confirmed feed back into:
- **Rule 2 (Generation Frame):** Constraint is now a simulation input. Trajectories that violate it are killed during enumeration, not after recommendation.
- **eos-metacognition F0:** If pattern mining reveals the source of a confidence decay or trajectory churn signal, it resolves the F0 early warning rather than requiring F1-F2 diagnostic.
- **USER MODEL:** If the mined constraint reveals a user operating pattern not yet in the USER MODEL, update the USER MODEL (per Rule 7 miss-flag protocol).

### C7.4: Anti-Noise

- Do not mine patterns from fewer than 3 contradiction history entries. Sample too small.
- Do not mine patterns from builder mode contradictions (condensed simulation — rejection patterns are methodologically different).
- Do not count user overrides after hold as the same weight as argued rejections. Overrides may be pragmatic ("just do it my way") rather than constraint-revealing.
- Maximum 2 pattern presentations per session. More than that is self-analysis overhead.

---

## C6: Notion Writes

Contradiction resolution is a decision-lock event when it results in:
- A bilateral agreement on a new trajectory → write per Rule 4 Agreement format
- A concession (either side) → write per Rule 4 Concession format
- A user override after hold → write as `CONTESTED → USER OVERRIDE` with: original recommendation, hold basis, user's direction, flagged assumptions

Routine contradictions that resolve within one exchange (user objects → system moves → done) are tracked in contradiction history but do not trigger immediate Notion writes unless they modify a locked variable or kill a previously locked trajectory.

---

## Integration Points

- **Rule 2 (Trajectory Enumeration):** This skill extends the enumeration loop. After recommendation, if user contradicts, this skill manages the re-entry.
- **Rule 4 (Position Integrity):** C2 is a direct application of Rule 4 to the trajectory context. Rule 4 is the authority; this skill is the trajectory-specific implementation.
- **Rule 5 (Regression Lock):** If a trajectory was locked as a survivor and the user's contradiction provides new evidence to unlock it, that's valid. If not, regression lock holds.
- **Rule 7 (User Authority):** User override after hold is valid per Rule 7. Logged, not blocked.
- **eos-project-mgmt:** Contradiction history feeds into the project's DECISIONS MADE log on resolution.
- **eos-memex:** If contradiction history grows large, compress per Memex protocol — index map entry, archive to Notion/Obsidian.

---

## Failure Modes

| Failure | Detection | Response |
|---|---|---|
| Contradiction captured without trajectory context | C1 fields incomplete — contested trajectory is blank | Pause. Ask: "Which path are you pushing back on?" before proceeding |
| Position held on pressure when new argument existed | User escalates frustration after hold | Review objection — if new argument was missed, concede explicitly and name the miss |
| Re-enumeration produces same recommendation | All alternatives fail simulation | State: "Simulation still favors [path] after incorporating your feedback. Here's what failed on alternatives: [specifics]. Override or provide additional constraints." |
| Contradiction loop (3+ rounds, no convergence) | C4 escalation trigger | Frame probe or shutdown signal check |
| Zombie trajectory resurfaces | Killed path recommended again despite contradiction history | Contradiction history check before every recommendation — mandatory |
