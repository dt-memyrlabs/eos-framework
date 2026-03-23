# Architecture

EOS v20.1.0 architectural philosophy and mechanical design.

---

## Context-Staging vs. Rule-Filtering

Most prompt engineering frameworks treat the problem as output filtering: write rules that constrain what the model produces. The model generates from its training distribution, and rules catch undesirable outputs after the fact.

This is structurally backwards. By the time a rule fires, the generation frame is already set. The model has already pattern-completed from its training priors. Rules can reject or modify outputs, but they cannot change what the model was generating *from*.

EOS operates on a different principle: **displacement**. Instead of filtering outputs, EOS shapes the generation frame by loading specific user context into the attention window before rules, identity declarations, or any other instructions. The model's causal attention mechanism is unidirectional -- token N can only attend to tokens 1 through N-1. Context that appears earlier in the window exerts stronger influence on downstream generation.

When the USER MODEL section contains specific, concrete information about the user's domain, methodology, vocabulary, and current project state, the weights pattern-complete from that context rather than from parametric defaults. The training prior is displaced, not suppressed. The distinction matters: suppression fights the distribution, displacement moves it.

### Why suppression fails

Training priors are not rules the model follows. They are statistical distributions the model generates from. A rule that says "do not produce generic advice" cannot prevent the model from generating generic advice -- it can only detect it after generation and trigger a retry. The generation frame was still generic. The retry generates from the same frame.

Displacement changes what the model generates from in the first place. If the USER MODEL contains specific domain context (47 client engagements, constraint-graph methodology, specific KPIs), the weights complete from that context. Generic advice is not suppressed -- it simply is not the most probable continuation.

### The attractor basin problem

Language models have attractor basins: high-probability response patterns that training made deeply entrenched. "Best practices" advice, hedged recommendations, consultant-speak. These basins are gravitational -- without strong countervailing context, generation falls into them.

EOS handles this at lens 4 (the default) with a single-line mechanic called **attractor basin naming**:

```
PRIOR: [specific conventional output the weights want to produce]. Target: [specific alternative from user context].
```

This line satisfies the conventional pattern -- it exists in context, so the weights treat it as completed territory. The next token has already "said" the conventional thing. Generation moves past it to the user-context alternative. One line of context displacement replaces what would otherwise require multiple passes of output filtering.

At lens 5, the conventional pattern gets zero tokens -- full displacement. At lens 3 and below, the conventional path gets progressively more development for diagnostic comparison.

---

## Token Ordering

The ordering of content in the context window is not cosmetic. Causal attention means earlier tokens shape the interpretation of later tokens, but not the reverse. EOS enforces a strict dependency order:

```
USER MODEL
  -> Identity
    -> Architecture
      -> Rules
```

**USER MODEL** comes first. It contains the user's domain, methodology, measurement criteria, current project state, vocabulary mappings, validated patterns, decision history, and operating context. Everything downstream -- identity declarations, architectural constraints, operational rules -- is interpreted through the USER MODEL, not abstractly.

**Identity** comes second. It declares generation targets: dry prose, declarative sentences, every sentence carries load. These targets are primed by the USER MODEL that precedes them. An identity declaration to "use the user's language when more precise" only works if the user's language is already in context above it.

**Architecture** comes third. The two-layer kernel+skills design, compression prohibition, and token ordering rules themselves. These are structural constraints that rules operate within.

**Rules** come last. They handle mechanical systems: goal locking, simulation requirements, regression protection, autonomy tiers. Rules are interpreted through everything above them. Rule 2 (Generation Frame) says "generate from USER MODEL first" -- this works because the USER MODEL is already in the attention window by the time Rule 2 is processed.

Any restructure that violates this ordering degrades downstream resolution. If rules appear before the USER MODEL, they are interpreted abstractly against training priors rather than against specific user context.

---

## Compression Prohibition

Named behaviors in the kernel cannot be compressed, folded, or summarized without an explicit audit. This is a locked variable.

The mechanism: causal attention creates distinct attention targets from named behaviors. When the kernel says "Regression Lock" and defines its mechanics, downstream tokens resolve the phrase "regression lock" against that specific definition. If the definition is compressed into a summary or folded into another section, the attention target is destroyed. Downstream tokens fall back to the training prior's interpretation of "regression lock" rather than the kernel's specific definition.

The compression audit protocol:

1. Enumerate every named behavior in the source.
2. Map each to a named behavior in the output.
3. Flag anything unmapped.
4. Unmapped items are restored or explicitly retired by user decision. Never silently dropped.

This prohibition exists because EOS v19-to-v20 migration required absorbing 11 named behaviors into upstream mechanisms. Each absorption was documented in the compression audit table with explicit disposition. Without this protocol, kernel updates silently drop behaviors and the system degrades without visible failure.

---

## Kernel + Skills Architecture

### Kernel

The kernel (`CLAUDE.md`) is loaded via system instructions at session start. It is a single file containing:

- **USER MODEL** -- populated at session start from persistence layers (Notion, Pieces LTM, auto-memory). Static entries persist across sessions. Dynamic entries are rebuilt per session.
- **Identity** -- generation targets and stance declarations.
- **Architecture** -- structural constraints including compression prohibition and token ordering.
- **Rules 1-10** -- operational mechanics.
- **Runtime Parameters** -- current settings, skill versions, module states.

The kernel is approximately 6,000 tokens. It is always loaded in full. No conditional loading, no compression.

### Skills

Skills are separate files stored in categorized directories. Each skill:

- Has YAML frontmatter declaring name, version, kernel compatibility, and trigger documentation.
- Activates on specific triggers (user keywords, state transitions, metric thresholds).
- References kernel rules without duplicating them.
- Has its own trigger-to-completion lifecycle.
- Operates within an assigned autonomy tier (Tier 1: full autonomy, Tier 2: notify only, Tier 3: require confirmation).

Skills are loaded on demand, not at session start. This keeps the base context window footprint at the kernel size only. Skill files are consumed when their trigger condition is met.

The kernel tracks skill state in the `module_state` runtime parameter and validates skill integrity (version, kernel compatibility) on every kernel version change.

---

## Two Control Axes

EOS exposes two independent dimensions that the user adjusts during conversation.

### Context Lens (1--5): Prior Displacement

Controls how much of the training prior enters the generation frame.

- At lens 5, the USER MODEL saturates the generation frame entirely. Convention gets zero tokens. Risk: blind spots if convention has something useful.
- At lens 4 (default), the conventional output is named in a single line (attractor basin naming), then generation proceeds from user context. The convention exists in the attention window as completed territory.
- At lens 3, both conventional and user-context paths are fully developed as parallel trajectories and compared against the goal.
- At lens 2, the conventional output is generated first as a complete artifact. Then the user-context alternative is generated alongside it. Diagnostic mode for seeing what the weights want to produce.
- At lens 1, no displacement at all. Pure training distribution output. Maps the attractor basin.

### Simulation Depth (1--7): Trajectory Pressure

Controls how many trajectories are explored and how aggressively each is tested. Independent of lens -- you can run high displacement with shallow simulation (fast, opinionated) or low displacement with deep simulation (thorough conventional analysis).

- At sim-depth 1, a single trajectory with a confidence tag. No enumeration. Use for routine, low-stakes responses.
- At sim-depth 3 (default), all viable trajectories are enumerated. Each gets one failure mode and one constraint test. The path with fewest assumptions wins.
- At sim-depth 5, after selecting a recommendation, the system generates the strongest counterargument to it. If the recommendation does not survive its own counterargument, it is killed and alternatives are re-ranked.
- At sim-depth 7, every trajectory is fully developed. Every assumption gets a falsification test. Adversarial counterargument must be survived. Constraint relaxation map is completed. Maximum compute.

The axes are independent. `[lens:5, sim-d:1]` means full user-context displacement with minimal simulation -- fast, high-conviction responses grounded entirely in user context. `[lens:2, sim-d:7]` means full conventional output with exhaustive simulation -- deep analysis of what the training distribution produces. Both are valid configurations for different purposes.

---

## State Storage Tiers

EOS uses a tiered persistence model. The tier is detected at session start by the `eos-memory-mgmt` skill.

- **Tier A (Notion):** Authoritative store. Decision-lock events write to Notion immediately via MCP. Notion Spoke pages hold project state. Hub pages index all projects. Drift detection at session start compares Notion state against conversation claims.
- **Tier B (Pieces LTM):** Supplementary. Writes supplement Notion as a secondary record. Pieces failure does not degrade CCI. When Pieces and Notion conflict, Notion wins.
- **Tier C (Claude native):** Baseline. State persists only in conversation history. Single-source recall is medium confidence until cross-validated. The kernel still functions; it loses cross-session memory fidelity.

The `ltm` counter in the runtime header tracks exchanges since the last Notion decision-lock write. At 5 or more, the header flags staleness.
