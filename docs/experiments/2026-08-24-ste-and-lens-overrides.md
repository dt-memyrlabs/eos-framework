# 2026-08-24 — Testing the two user-authority overrides (STE gate, named lens)

Both v22.4.1 (named lens in header) and v22.5.0 (STE output gate) shipped on user authority with no harness run. This run closes both open assumptions. Harness: `tools/eos-test.workflow.js`, standard mode, 8 tasks × (2 generations + 2 judges) = 32 agents per test. Task battery drawn from the user's real work (6 relevant, 2 neutral). Actual spend: ~3.34M tokens across both tests (estimate was 2.88M; per-agent baseline of 45k ran ~16% hot).

Both hypotheses and criteria were pre-registered before launch and are echoed verbatim in the run outputs.

---

## Test 1 — STE output gate (v22.5.0)

**Hypothesis (pre-registered):** ASD-STE100 writing rules improve answer clarity on technical/instructional tasks without a quality cost. Known risk: robotic tone on relational tasks.

**Criteria (pre-registered):** Supported if ste-on takes ≥60% of decided relevant judgments AND meanQuality(ste-on) ≥ meanQuality(ste-off) − 0.5. Refuted if ste-off takes ≥60% or quality deficit > 1.0. Else inconclusive.

**Result — SUPPORTED, at the exact boundary:**

| Metric (relevant tasks, 12 judgments) | ste-on | ste-off |
|---|---|---|
| Wins | **8** | 4 |
| Mean quality | 7.8 | 8.3 |
| Mean specificity | 6.4 | 7.2 |

- 8/12 = 66.7% ≥ 60% ✓. Quality deficit exactly 0.5 — passes the "≥ −0.5" bar with zero margin.
- Judges credited ste-on for one-pass parseability: short imperative sentences, one instruction per sentence. Where it lost, the sentence caps had forced prose summaries of things that needed exact SQL — the reader would have to translate before acting.
- **Neutral tasks (4 judgments): ste-off won 3–1, quality 8.5 vs 6.8, pollution flagged on 75% of ste-on answers.** The pre-registered risk materialized: STE makes relational and explanatory output stiff and over-structured.

**Honest read:** the gate helps instructional/technical output and taxes everything else. The 0.5 quality deficit on relevant tasks means STE trims load-bearing detail, not just fat. A scoped gate (technical/instructional output only) is the shape the data points at — that is a kernel change requiring its own decision, not shipped here.

## Test 2 — Named lens in header (v22.4.1)

**Hypothesis (pre-registered):** requiring the response to open by declaring a named lens improves layer-fit and quality. Confound declared upfront: any win may be a generic plan-first effect, not lens-specific.

**Criteria (pre-registered):** Supported if lens-on ≥60% of decided relevant judgments; refuted if lens-off ≥60%; else null — no measured benefit, the field is cosmetic, keeping it is pure user preference, assumption closes as no-effect.

**Result — NULL:**

| Metric (relevant tasks, 12 judgments) | lens-on | lens-off |
|---|---|---|
| Wins | 7 (58.3%) | 5 (41.7%) |
| Mean quality | 8.0 | 7.9 |
| Mean specificity | 7.1 | 7.3 |

- 58.3% misses the 60% support bar; 41.7% misses the refute bar. Every quality/specificity delta is ≤0.2 — noise.
- Neutral tasks: lens-off won 4–0 (n=4, small), quality 8.0 vs 7.5 — mild evidence the mandate costs a little on tasks with no layer ambiguity.
- **The assumption closes as no-effect.** The lens field's value in the header is a declared fact, and declaring it neither helps nor hurts measurably. Keeping it is user preference, which is a legitimate basis — it just isn't a measured one, and the kernel now says so.

## Limitations

Same as the 2026-07-14 run: n=8 tasks, one run each, same model family generating and judging. STE's quality criterion passed with zero margin — a single judgment flipping would fail it; treat "supported" as fragile. The lens null is consistent with the prior expectation that a one-word prime sits below what this harness can resolve. Judges could not be blinded to writing style itself (the variable under test is visible in the text); they were blinded to the hypothesis.

## Dispositions

- **STE gate:** stays in the kernel; its annotation changes from "open assumption" to this measured result. Scoping decision (technical-only vs global) is open and belongs to the user. **DECIDED same day (2026-08-24, user):** scoped to technical/instructional output; relational, explanatory, and evaluative responses exempt. Shipped as v22.6.0.
- **Named lens:** stays in the header by standing user decision; its annotation changes from "open assumption with a registered eos-test path" to "measured null, kept by user preference." **Reaffirmed by user 2026-08-24** against a retirement recommendation; the 2026-07-25 in-vivo steering tally runs to its 2026-09-01 deadline and settles the evidence question. The user separately reports the lens "seems to steer at times" (output-side) — an open conditional hypothesis; the pooled n=12 null cannot rule out per-task-type effects, and it stays untestable until instances are named live.
