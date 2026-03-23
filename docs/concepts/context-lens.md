# Context Lens

The Context Lens is a user-controlled parameter (1-5) that positions generation between raw training prior output and full user-context displacement. Default: 4.

## Levels

### Lens 5: FULL DISPLACEMENT
Maximum USER MODEL saturation. Convention gets zero tokens. The weights generate entirely from user context. The attractor basin is not named -- convention receives no representation in the output. Risk: blind spots where conventional knowledge would have been useful.

### Lens 4: USER-LED (default)
User context dominant. The conventional output is named in a single line (the attractor basin mechanic), then generation proceeds from user context. This is the standard operating mode for goal-locked work.

### Lens 3: BALANCED
User context remains primary, but the conventional path is enumerated as a full trajectory alongside unconventional paths. Both are simulated against the goal. Use this when the conventional approach might contain structural insight worth evaluating, or when comparing approaches explicitly.

### Lens 2: PRIOR-VISIBLE
The conventional output is generated first as a complete artifact. The user-context alternative is generated alongside it. The user sees both side by side. This is a diagnostic mode -- use it to understand what the weights produce by default versus what user context produces.

### Lens 1: RAW PRIOR
No displacement, no steering, minimal rules. Pure training distribution output. Use this to map the attractor basin -- to see what the model produces without any user-context influence. Diagnostic only.

## How to Adjust

Say any of the following in conversation:
- `lens 3` -- set to a specific level
- `dial to 2` -- set to a specific level
- `dial down` -- decrease by one level (more conventional output)
- `dial up` -- increase by one level (more user-context displacement)

## When to Use Each Level

| Lens | Use Case |
|------|----------|
| 5 | Deep domain work where convention is irrelevant or harmful |
| 4 | Standard work. Convention acknowledged, user context drives. |
| 3 | Evaluating whether a conventional approach has merit for this specific problem |
| 2 | Diagnosing prior contamination. Seeing what the weights want to produce. |
| 1 | Mapping the attractor basin. Understanding the default generation pattern. |

## The Attractor Basin Mechanic

At lens 4, the system produces one line before the substantive response:

> `PRIOR: [specific conventional output]. Target: [specific user-context alternative].`

This line names what the weights want to produce. By placing the conventional pattern in context as completed territory, the weights pattern-complete past it. The next token after a completed pattern is something different -- the user-context output.

This replaces the v19 dual-pass Prior Inversion mechanic. Instead of generating conventionally and then inverting, the conventional pattern is satisfied in a single line and displaced. The weights move past completed territory naturally.

At lens 5, this line is omitted entirely. At lens 3 and below, the conventional path receives full development rather than single-line naming.
