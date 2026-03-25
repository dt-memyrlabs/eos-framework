---
name: eos-metacognition
version: "v1.2.0"
kernel_compat: "v20.5.0"
state: auto-monitor
description: "Self-correction system — early warning detection, prediction calibration, rule friction auditing, autonomous rule patching, cross-session lessons. F0 (early warning) runs passively every response when goal is locked, detecting degradation patterns before they hit diagnostic thresholds. Auto-escalates to F1 when 2+ signals detected. F1-F2 (diagnostic) AUTO-TRIGGER on threshold breach: 3 consecutive LOW confidence or limiter rejection rate > 50%. F3 (patching) requires user confirmation at Tier 3 — includes anti-churn check against patch history. F4 (cross-session lessons) reads tasks/lessons.md at session start, writes corrections immediately on occurrence, escalates at 3+ cross-session occurrences. File-based — no external dependency. Also triggers on explicit request ('run meta-cognition', 'self-check', 'audit the rules')."
---

# Module F: Meta-Cognition (Self-Correction)

**Trigger conditions (auto-fire, no permission needed for F0-F2):**
- F0 fires continuously (every response when goal is locked). Lightweight scan — no token overhead unless signal detected.
- F1-F2 fire on threshold breach: 3 consecutive LOW confidence, or limiter rejection rate > 50%.
- User explicit request.

**Autonomy:**
- F0 (early warning): **Tier 1 — runs autonomously.** Passive monitor. Surfaces signal only when pattern detected.
- F1-F2 (diagnostic): **Tier 1 — runs autonomously.** The metrics triggered, the system responds.
- F3 (patching): **Tier 3 — requires user confirmation.** Changing rules is irreversible. Anti-churn check before proposing.
- F4 (cross-session patterns): **Tier 1 — load and check autonomous.** Escalation follows F3/kernel-updater Tier 3 gates.

**Kernel rules in play:** Rule 2 (Generation Frame + self-audit), Rule 4 (Contradiction — including internal), Rule 6 (Autonomy Tiers), Rule 7 (Conflict Resolution — including internal).

---

## F0. Early Warning Detection (Tier 1 — passive monitor)

Fires every response when a goal is locked. Detects degradation patterns before they hit F1-F2 thresholds. The point: intervene at signal, not at symptom.

**Signals monitored (any single signal = advisory, 2+ = auto-escalate to F1):**

| Signal | Detection | Weight |
|---|---|---|
| Confidence decay | 2 consecutive MEDIUM after prior HIGH, or HIGH → LOW in one step | 1 |
| Assumption accumulation | 3+ open assumptions added in last 5 exchanges without any validation | 1 |
| CCI-G stall | CCI-G unchanged for 5+ exchanges during active work (not idle) | 1 |
| Trajectory churn | 2+ trajectory re-enumerations in 5 exchanges without convergence | 1 |
| Constraint promotion failure | 2+ assumptions tested but none promoted or invalidated (simulation running but not resolving) | 1 |
| User correction clustering | 2+ user corrections (Rule 7 miss flags) in 3 exchanges | 2 (double weight) |
| Regression near-miss | Variable re-opened then re-locked to same value (Rule 5 churn) | 1 |

**Behavior:**
- **Single signal:** Log internally. No output. Continue monitoring.
- **2+ signals (or 1 double-weight):** Surface in response: `⚠️ F0 EARLY WARNING: [signals detected]. Auto-escalating to F1 diagnostic.` Then run F1 immediately.
- **Signal cleared:** If monitored signals drop below threshold, reset. No persistent flag.

**Anti-noise:** F0 does NOT fire during:
- First 3 exchanges of a session (insufficient data).
- Builder mode (condensed simulation — confidence patterns differ).
- User-initiated lens/sim-depth changes (transient disruption, not degradation).

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

**Anti-churn check:** Before proposing any patch, query Notion for the target rule's patch history (via `eos-kernel-updater` log). If 2+ prior patches exist on the same rule across sessions, do not propose an incremental patch. Instead, escalate to `eos-kernel-updater` with classification `STRUCTURAL_REVIEW`. Flag: `F3 churn detected on [rule]: [N] prior patches. Escalating to structural review.` The rule needs redesign, not another tune.

---

## Post-Diagnostic

After F1-F2 complete:
- State what was found in 2-3 lines.
- If F3 is warranted, present the patch proposal immediately.
- If nothing actionable found, say so and return to normal operation.
- Don't linger on self-analysis. Diagnose, propose if needed, move.

---

## F4. Cross-Session Lessons (Tier 1 — autonomous load/check)

Tracks correction, contradiction, and stall patterns across sessions via `tasks/lessons.md`. File-based — no external dependency. The point: detect that the same type of mistake keeps happening, and build self-correcting rules from corrections.

### F4.1: Session Start (Load)

On session start (after M1 persistence detection completes, before substantive work):

1. Read `tasks/lessons.md` from the project root. If file does not exist, create it with the schema from F4.4.
2. Load active lessons (status: `tracking` or `escalated`) into working context as compact summary: `[lessons: N tracking, M escalated]`.
3. **Apply lessons proactively.** For each active lesson, treat its `rule` field as a behavioral constraint for this session. The lesson is a correction that must not repeat.

### F4.2: During Session (Record)

When F0 detects a user correction (the "user correction clustering" signal), when F1 identifies a misalignment pattern, or when the user explicitly corrects behavior:

1. Extract the correction signature: what went wrong, which rule was violated (if any), what the correct behavior should be.
2. Write a self-correcting rule: a concise imperative statement that prevents the same mistake. Not a description of the error — a rule that fixes it.
3. Match against loaded lessons from F4.1 — match by rule violated or behavior class.
4. **No match:** Append new lesson to `tasks/lessons.md` immediately. Do not defer to session end.
5. **Match found:** Increment occurrence count. Update the session dates. If the match is against a lesson from a previous session, this is a cross-session recurrence.
6. **Escalation threshold (3+ occurrences across distinct sessions):**
   - Surface: `⚠️ CROSS-SESSION PATTERN: [description]. Occurred in [N] sessions. This is structural, not incidental.`
   - If the pattern implicates a specific kernel rule → escalate to `eos-kernel-updater` with the pattern as evidence.
   - If the pattern implicates a skill behavior → escalate to F3 (which will apply its own anti-churn check before patching).
   - Update lesson status to `escalated`.

### F4.3: On Correction (Write Immediately)

Lessons are written to `tasks/lessons.md` at the moment of correction, not batched to session end. Cross-session learning is too important to lose to a crashed session.

1. Open `tasks/lessons.md`, append the new lesson or update the existing entry.
2. Commit the file if in a git repo (Tier 1 — autonomous, no confirmation needed).
3. Format: one lesson per table row, following the schema in F4.4.

### F4.4: `tasks/lessons.md` Schema

```markdown
# Lessons

Corrections and self-improving rules. Read at session start, written on every correction.

| Pattern | Rule | Count | Sessions | Status |
|---|---|---|---|---|
| [what went wrong — concise] | [imperative: "Always X" or "Never Y"] | [N] | [date1, date2, ...] | tracking/escalated/resolved |
```

- **Pattern:** The structural description of the mistake. Strip session-specific nouns.
- **Rule:** The self-correcting imperative. This is what gets loaded as a behavioral constraint at session start.
- **Count:** Total occurrences across all sessions.
- **Sessions:** Dates when this pattern was observed.
- **Status:** `tracking` (monitoring), `escalated` (3+ occurrences, flagged for structural fix), `resolved` (fix confirmed working).

### F4.5: Integration

- **C5.3 (Outcome Accuracy):** Persistent prediction bias detected by C5.3 is registered as a lesson in F4 (type: stall — the system keeps making the same prediction error).
- **F0 (Early Warning):** F0's "user correction clustering" signal is the primary input for F4 lesson matching.
- **eos-kernel-updater:** Escalated lessons become evidence inputs for kernel update proposals.
- **Notion (supplementary):** If Tier A is available, lessons are also written to Notion Spoke PATTERN REGISTRY as a backup. File is primary. Notion is supplementary.

---

## Cross-References

- **eos-kernel-updater:** F3 anti-churn check queries kernel-updater's patch history. F4 escalates cross-session patterns to kernel-updater for structural review.
- **eos-memory-mgmt:** F4 operates independently of persistence tier — `tasks/lessons.md` is always available.
- **eos-project-mgmt C5.3:** Persistent prediction bias feeds into F4 as a stall-type lesson.
