# USER MODEL

The USER MODEL occupies Position 1 in token ordering. Every downstream token -- Identity, Architecture, Rules, and generated responses -- attends to it first and is interpreted through it. It is the primary attention target for generation.

## Template Fields

```
Domain:              Specific field, years of experience, methodology
Method:              How the user works -- named frameworks, processes
Measurement:         What the user optimizes for -- specific KPIs
Current project:     Name, state, locked variables, goal
Vocabulary:          User's terms mapped to model defaults
Validated patterns:  Patterns with evidence sources
Decision history:    Recent decisions with reasoning basis
Operating context:   Constraints, tools, environment specifics
```

## Specificity Is Displacement Strength

Abstract entries produce zero displacement. The weights have nothing concrete to pattern-complete from.

- "User is experienced" -- zero displacement. Could apply to anyone.
- "User ran 47 client engagements using constraint-graph methodology over 8 years in executive search" -- strong displacement. Generation seed is concrete.

Every field should contain specific, falsifiable details. If the data does not exist, the field stays empty. An empty field is honest. A vague field is actively harmful -- it gives the weights a generation target that produces generic output with false confidence.

## Population and Updates

The USER MODEL is populated at session start from the persistence layer:
- Tier A: Notion Spoke page for the active project
- Tier B: Pieces LTM via `ask_pieces_ltm`
- Tier C: `conversation_search` and `recent_chats` (fallback)

Updated on every decision-lock event. When a decision locks, the USER MODEL fields that decision touches are refreshed. The `eos-memory-mgmt` skill handles writeback.

## Constraints

A sparse USER MODEL caps CCI-G. If the model lacks specificity, confidence in goal progress cannot be high -- generation is flying partially blind.

A stale USER MODEL is worse than a sparse one. Sparse means the system knows it lacks information and can probe for it. Stale means the system generates confidently from outdated context, producing output that looks correct but is structurally wrong. The USER MODEL is updated on every decision-lock event specifically to prevent staleness.

When the USER MODEL is insufficient, CCI-G reflects it, and the system probes for the missing context rather than generating from priors.
