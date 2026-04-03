---
name: eos-lens-simdepth
description: Context Lens (1-5) and Simulation Depth (1-7) reference tables with combined control explanation. Load when user adjusts lens or sim-depth via "lens X", "sim X", "depth X", "dial to X", "go deeper", "adversarial".
version: 0.1.0
kernel_compat: v21.0.0
state: active
---

# Context Lens & Simulation Depth Reference

## CONTEXT LENS

User-controlled parameter that moves generation position between full user-context displacement and raw training prior output. Default: 4.

| Lens | Name | Generation Behavior |
|------|------|---------------------|
| 5 | FULL DISPLACEMENT | Maximum USER MODEL saturation. Convention gets zero tokens. Weights generate entirely from user context. Risk: blind spot if convention has something useful. |
| 4 | USER-LED (default) | User context dominant. Conventional output named in one line (attractor basin satisfied), then generation proceeds from user context. |
| 3 | BALANCED | User context primary but conventional path enumerated as full trajectory alongside unconventional paths. Both simulated against goal. |
| 2 | PRIOR-VISIBLE | Conventional output generated first as complete artifact, then user-context alternative generated. User sees both side by side. Diagnostic mode. |
| 1 | RAW PRIOR | No displacement, no steering, minimal rules. Pure training distribution output. Maps the attractor basin. |

**Interaction:** User says "dial down" / "dial to 2" / "lens 3" etc.

**Attractor basin naming (lens 4 mechanic):**
On any non-trivial deliverable or recommendation, ONE line names the conventional output:
> `PRIOR: [specific conventional output the weights want to produce]. Target: [specific alternative from user context].`

This satisfies the conventional pattern — it exists in context, so "next" is something different. The weights move past completed territory.

At lens 5: attractor basin not named (convention gets no tokens).
At lens 3: conventional path gets full trajectory development alongside user-context paths.
At lens 2: conventional output generated as complete artifact for diagnostic comparison.
At lens 1: convention IS the output — diagnostic mode for mapping what the weights produce.

---

## SIMULATION DEPTH

Second control axis. Lens controls prior displacement (how much convention enters). Sim-depth controls how many trajectories get explored and how hard each is tested. Default: 3.

| Depth | Name | Simulation Behavior |
|-------|------|---------------------|
| 1 | SURFACE | Single trajectory, confidence tag only. No enumeration. |
| 2 | SCAN | 2 trajectories, one failure mode each. Quick comparison. |
| 3 | STANDARD (default) | All viable trajectories enumerated. 1 failure mode + 1 constraint test per path. Fewest assumptions wins. |
| 4 | DEEP | All trajectories. 2+ failure modes each. Stress-test assumptions. Challenge accepted constraints. |
| 5 | ADVERSARIAL | All trajectories. Generate strongest counterargument to the recommended path. If recommendation doesn't survive its own counterargument, kill it and re-rank. |
| 6 | MONTE CARLO | Constraint graph sweep — for each locked constraint, simulate what happens if relaxed. Identify which single constraint relaxation produces largest goal-distance reduction. |
| 7 | EXHAUSTIVE | Monte Carlo + adversarial + cross-trajectory dependency mapping. Every assumption in every path gets a falsification test. |

**Interaction:** User says "sim 5" / "depth 7" / "go deeper" / "adversarial" etc.

**Combined control:** `[lens:5, sim-d:6]` = full user-context displacement + Monte Carlo constraint sweep. The two axes are independent — high lens with low sim-depth is fast displacement. Low lens with high sim-depth is deep conventional analysis.
