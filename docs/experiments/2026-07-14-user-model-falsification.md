# Experiment: USER MODEL falsification test

**Date:** 2026-07-14
**Status:** Complete. Registered hypothesis supported; framework's structured format refuted.
**Consequence:** EOS v22 — prose user model, structured field format retired, lens/sim-depth axes retired, header reduced to stateable facts.

This is the test the v21.1 README committed to: *"run the same task with a populated vs. empty USER MODEL and compare against the noun-swap test."* It was run by the model the framework targets (Claude, via Claude Code multi-agent orchestration), against the framework author's real project context. The result was allowed to cut the framework, and did.

## Pre-registered design

Design, conditions, metrics, and decision criteria were locked before any output was generated.

**Hypothesis:** A populated USER MODEL produces measurably more user-specific output than no user model, at no quality cost. Falsified if personalized outputs win no more often than chance, or if their "specificity" is the user's nouns decorating generic advice.

**Conditions** (identical task prompt, identical generation instructions):
- **A** — the EOS-format USER MODEL, populated with the author's real infrastructure and CRM project facts (labeled fields: Domain / Method / Current projects / Vocabulary / Operating context).
- **B** — no user context ("You have no saved information about this user").
- **C** — *exploratory:* the identical facts as one unstructured prose paragraph. Tests whether the EOS structure adds anything beyond the facts themselves.

**Tasks:** 8 total. Six drawn from the author's real work where context could matter (camera retention policy, CRM duplicate handling, remote access to a camera system, a filling storage drive, a dedup SOP, AI motion detection). Two deliberately context-neutral (a RAID 1 vs RAID 5 explainer; a short apology email) to detect *over*-application — context injected where it doesn't belong.

**Judging:** For each task, two comparisons (A vs B, A vs C), each scored by 2 independent judges — 32 judgments total. Judges received the requester's true situation for evaluation but were blind to the hypothesis, the direction of the test, and which condition produced which response. Presentation order alternated by task to cancel position bias. Rubric: specificity (0–10, count of recommendations that depend on this user's actual situation), portability (would the answer work verbatim for any user — the noun-swap test operationalized), quality (0–10, technical correctness judged independently of personalization, with explicit instruction that repeating the requester's details back earns no credit), and pollution (irrelevant personal context dragged in).

**Decision criteria (locked in advance):** Supported if A wins ≥5/6 relevant tasks with lower portability and no quality drop. If A ≈ C, the structured format adds nothing over prose.

## Results

### Registered: populated USER MODEL (A) vs no context (B) — relevant tasks, 12 judgments

| Metric | A (user model) | B (none) |
|---|---|---|
| Wins | **11** | 1 (0 ties) |
| Mean specificity | **7.9** | 3.3 |
| Mean quality | **8.5** | 8.0 |
| Portable (noun-swap fails) | **0%** | 67% |
| Pollution | 0% | 0% |

Task-level: 5 of 6 tasks unanimous for A; 1 split (camera retention — the no-context answer independently raised claim-window and provincial privacy-law considerations the judges valued). **Criterion met. The core claim survives falsification:** specific user context measurably displaces generic output, at no quality cost, with zero observed over-application — the sign test on 11/12 gives p ≈ 0.003 if judgments are treated as independent (they are only partly so; see limitations).

### Exploratory: EOS format (A) vs identical facts as prose (C) — relevant tasks, 12 judgments

| Metric | A (EOS format) | C (prose) |
|---|---|---|
| Wins | 2 | **10** (0 ties) |
| Mean specificity | 7.7 | **8.4** |
| Mean quality | 7.8 | **8.5** |

On the neutral tasks C also won 4/4 (and A beat B 4/4 with zero pollution — "neutral" tasks still benefited from context, helpfully). **Overall, prose beat the structured format 14 of 16.** Judge rationales credited the prose-condition answers with more precise technical mechanics and more situation-specific reasoning — e.g., correctly describing the NVR's folder-based retention model where the structured-condition answer was muddled, and arguing continuous rather than motion-triggered recording for a long-retention camera because motion detection misses slow inventory shrinkage.

**Working hypothesis on mechanism** (untested): terse labeled fragments ("Method: local-first") carry less inferable meaning than prose sentences; the model builds a richer user picture from the paragraph. Falsification criterion for this hypothesis: re-run with a third format (structured fields expanded into full sentences per field); if it matches prose, structure per se was never the problem — compression was.

## Limitations

- n = 6 relevant tasks, one generation per cell, one run. Directional evidence, not law.
- Generator and judges are the same model family (Claude judging Claude); self-preference effects unmeasured.
- Judges could not be blinded to which answer was personalized — that is visible on its face. They were blinded to the hypothesis, and the rubric explicitly withheld quality credit for context-parroting.
- The two judges per comparison saw identical presentations; their agreement overstates independence.
- The author's context is one user in two domains (physical infrastructure, CRM). Generalization to other domains is assumed, not shown.

## Consequences applied (v22)

1. USER MODEL rewritten as prose; labeled-field format retired.
2. Lens and sim-depth control axes retired (untested machinery on top of a refuted premise about format-level control).
3. CCI-G percentage retired; runtime header reduced to fields with a stateable factual basis (goal state, open-assumption count, derived confidence, position).
4. The kernel now cites this experiment and inherits its limitation: re-test before re-adding structure.
