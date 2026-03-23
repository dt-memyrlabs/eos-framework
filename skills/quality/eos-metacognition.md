---
name: eos-metacognition
version: "v1.0.1"
kernel_compat: "v20.0.0"
description: "Self-correction system — prediction calibration, rule friction auditing, autonomous rule patching. AUTO-TRIGGERS when 3 consecutive responses have LOW confidence, or limiter rejection rate exceeds 50%. Diagnostic steps (F1-F2) run autonomously at Tier 1 without asking. Rule patches (F3) require user confirmation at Tier 3. Also triggers when the user explicitly says 'run meta-cognition', 'self-check', 'audit the rules', or 'what's not working'. Always trigger when quantitative thresholds are met — do not wait for permission to diagnose."
---

# Module F: Meta-Cognition (Self-Correction)

**Trigger conditions (auto-fire, no permission needed for F1-F2):**
- 3 consecutive responses with confidence = LOW during any active project work.
- Limiter rejection rate > 50% (over last 10 proposals, or whole session if fewer).
- User explicit request.

**Autonomy:**
- F1-F2 (diagnostic): **Tier 1 — runs autonomously.** The metrics triggered, the system responds.
- F3 (patching): **Tier 3 — requires user confirmation.** Changing rules is irreversible.

**Kernel rules in play:** Rule 2 (Generation Frame + self-audit), Rule 4 (Contradiction — including internal), Rule 6 (Autonomy Tiers), Rule 7 (Conflict Resolution — including internal).

---

## F1. Prediction Calibration (Tier 1 — autonomous)

Runs immediately when triggered. No user prompt needed.

Review recent proposals:
- How many accepted vs rejected?
- If rejection rate > 50%, flag "Model Misalignment."
- Identify the pattern: consistently wrong about the same type of thing?

Output (surfaced in response): `Meta-cognition triggered: [trigger reason]. Calibration: [X] accepted, [Y] rejected. Pattern: [description or "no consistent pattern"].`

## F2. Rule Friction Auditing (Tier 1 — autonomous)

Runs immediately after F1.

Identify rules causing drag:
- Rules triggering false positives repeatedly.
- Rules creating overhead disproportionate to value.
- Rules the user is consistently working around.
- **Rules contradicting each other** (per Rule 4 expanded scope).

Output (surfaced in response): `Friction points: [list with evidence]. Internal contradictions: [any found or "none detected"].`

## F3. Autonomous Rule Patching (Tier 3 — requires confirmation)

Only runs if F1-F2 identify actionable issues. Presents to user, does not apply without confirmation.

Draft specific amendment to EOS (kernel or skill file):
- **What changes:** exact text diff.
- **Why:** the friction or failure it addresses.
- **What it fixes:** specific scenarios that improve.
- **What it could break:** honest risk assessment.
- **Contradiction check:** has this patch been simulated against all other active rules? (Rule 2 self-audit obligation.)

**Anti-loop Safeguard:** After a patch is applied, F3 won't propose another patch for the same root cause for at least 5 sessions, unless user explicitly requests.

---

## Post-Diagnostic

After F1-F2 complete:
- State what was found in 2-3 lines.
- If F3 is warranted, present the patch proposal immediately.
- If nothing actionable found, say so and return to normal operation.
- Don't linger on self-analysis. Diagnose, propose if needed, move.
