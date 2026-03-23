# Simulation Depth

Simulation Depth is the second control axis (1-7), independent of Context Lens. It controls how many trajectories are explored and how aggressively each is tested. Default: 3.

## Levels

### Depth 1: SURFACE
Single trajectory. Confidence tag only. No enumeration, no failure mode analysis. Use for routine, low-stakes responses where the path is obvious.

### Depth 2: SCAN
Two trajectories, one failure mode each. Quick comparison to verify the primary path holds. Use when a sanity check is sufficient.

### Depth 3: STANDARD (default)
All viable trajectories enumerated. Each path gets one failure mode and one constraint test. The path with fewest assumptions wins. Standard depth for all goal-locked work.

### Depth 4: DEEP
All trajectories. Two or more failure modes per path. Assumptions are explicitly stress-tested. Accepted constraints are challenged for validity. Use for high-stakes decisions or when assumptions feel shaky.

### Depth 5: ADVERSARIAL
After selecting a recommended path, the system generates the strongest possible counterargument against it. If the recommendation does not survive its own counterargument, it is killed and survivors are re-ranked. Use when the recommendation needs to be bulletproof.

### Depth 6: MONTE CARLO
Constraint graph sweep. For each locked Hard or Structural constraint, simulate what happens if that constraint is relaxed. Report which single constraint relaxation produces the largest reduction in goal-distance. Identifies the highest-leverage constraint to challenge. Use when progress is blocked and you suspect a constraint is artificial.

### Depth 7: EXHAUSTIVE
All of the above combined. Every trajectory fully developed to structural detail. Every assumption gets a falsification test. Adversarial counterargument must be survived. Constraint relaxation map is complete. Cross-trajectory dependency mapping included. Maximum compute, maximum confidence. Use sparingly -- this is expensive.

## Independence from Context Lens

The two axes are orthogonal:

| Combination | Behavior |
|-------------|----------|
| High lens (5) + low sim-depth (1) | Fast displacement. User context only, single path, no deep analysis. |
| Low lens (1) + high sim-depth (7) | Deep conventional analysis. Raw prior output with exhaustive trajectory testing. |
| High lens (4) + high sim-depth (5) | User-context-driven adversarial testing. Standard operating mode for critical decisions. |
| Low lens (2) + low sim-depth (2) | Quick diagnostic. See what convention produces with minimal analysis. |

Set them independently based on the task: lens controls whose context drives generation, sim-depth controls how hard you test it.

## How to Adjust

Say any of the following in conversation:
- `sim 5` -- set to a specific depth
- `depth 7` -- set to a specific depth
- `go deeper` -- increase by one level
- `adversarial` -- set to depth 5
