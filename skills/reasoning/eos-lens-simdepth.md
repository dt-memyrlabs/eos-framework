---
name: eos-lens-simdepth
description: Lens (named, free-form), Displacement Dial (1-5) and Simulation Depth (1-7) reference with combined control explanation. Load when user steers the lens via "lens: <name>", adjusts the dial via "dial to X", or sim-depth via "sim X", "depth X", "go deeper", "adversarial".
version: 0.2.0
kernel_compat: v21.1.0
state: active
---

# Lens, Displacement Dial & Simulation Depth Reference

## LENS (named — v21.1)

Declares **what layer of work the response operates on**. Filled at position zero of every response (the runtime header's first slot), which makes it a steering token, not a status badge: the model commits to a classification before generating the body, and everything downstream attends to it.

**Names are free-form by design.** The frame is rigid (the slot must be filled, every response); the interior is free (any name). No enumerated vocabulary — the mechanism mandates that classification happens, not what the classes are. Typical names that emerge in practice: `goal-framing`, `product-thesis`, `build`, `debug`, `review`, `pitch`, `meta-reasoning`.

**User steering (deterministic, via UserPromptSubmit hook):**

```
lens: build      → steer + lock the lens; model generates under it and holds it
lens: off        → unlock; lens choice returns to the model (also: free, unlock, auto)
```

The hook persists the directive to the state file and injects the steering instruction *before the model reads the prompt*. A user-locked lens holds until the user unlocks or steers a new value — the model flags out loud if a locked lens no longer fits the work rather than silently switching (Rule 7: only the user moves what the user set).

**History:** through v21.0 this slot held the numeric prior-displacement setting (1–5). v21.1 splits the two instruments: the layer declaration keeps the `lens` name; the numeric dial is renamed below.

---

## DISPLACEMENT DIAL (1–5, formerly "Context Lens")

User-controlled parameter that moves generation position between full user-context displacement and raw training prior output. Default: 4. Tracked in the state file as `dial`; surfaced in conversation only when it leaves the default.

| Dial | Name | Generation Behavior |
|------|------|---------------------|
| 5 | FULL DISPLACEMENT | Maximum USER MODEL saturation. Convention gets zero tokens. Weights generate entirely from user context. Risk: blind spot if convention has something useful. |
| 4 | USER-LED (default) | User context dominant. Conventional output named in one line (attractor basin satisfied), then generation proceeds from user context. |
| 3 | BALANCED | User context primary but conventional path enumerated as full trajectory alongside unconventional paths. Both simulated against goal. |
| 2 | PRIOR-VISIBLE | Conventional output generated first as complete artifact, then user-context alternative generated. User sees both side by side. Diagnostic mode. |
| 1 | RAW PRIOR | No displacement, no steering, minimal rules. Pure training distribution output. Maps the attractor basin. |

**Interaction:** User says "dial down" / "dial to 2" / "dial 3" etc. (Numeric values no longer parse as lens steering — the lens hook regex requires names.)

**Attractor basin naming (dial 4 mechanic):**
On any non-trivial deliverable or recommendation, ONE line names the conventional output:
> `PRIOR: [specific conventional output the weights want to produce]. Target: [specific alternative from user context].`

This satisfies the conventional pattern — it exists in context, so "next" is something different. The weights move past completed territory.

At dial 5: attractor basin not named (convention gets no tokens).
At dial 3: conventional path gets full trajectory development alongside user-context paths.
At dial 2: conventional output generated as complete artifact for diagnostic comparison.
At dial 1: convention IS the output — diagnostic mode for mapping what the weights produce.

---

## SIMULATION DEPTH

Second control axis. The dial controls prior displacement (how much convention enters). Sim-depth controls how many trajectories get explored and how hard each is tested. Default: 3.

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

**Combined control:** `[lens:build] [sim-d:6]` with `dial=5` = build-layer work, full user-context displacement, Monte Carlo constraint sweep. The three axes are independent — the lens names the layer, the dial sets prior-mixing, sim-depth sets trajectory rigor.
