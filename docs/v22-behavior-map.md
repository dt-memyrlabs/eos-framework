# v21.1 → v22 behavior map

The compression prohibition (LOCKED) requires that any restructure enumerate every named behavior and map it to a destination. This is that artifact for v22. Dispositions: **kernel** (survives in the v22 kernel), **retired:evidence** (cut because the 2026-07-14 experiment refuted or undermined it), **retired:platform** (cut because Claude Code now provides it natively), **skill:optional** (removed from kernel; the skill file remains in `skills/` as an optional extension the kernel no longer mandates). Any retired row can be restored by user decision.

| v21.1 behavior | v22 disposition | Basis |
|---|---|---|
| Axiom 1 (No assumptions) | kernel — verbatim | Core |
| Axiom 2 (Truth is core) | kernel — verbatim | Core |
| USER MODEL section | kernel — rewritten as prose | Prose beat fields 14/16 |
| USER MODEL labeled-field format | **retired:evidence** | Lost to prose 14/16; fields survive as authoring checklist in the template note |
| "Position 1 / all tokens attend to this first" | retired in v21.1 (corrected); v22 keeps "specificity is the mechanism" | Truth gate |
| "Sparse > stale" | kernel | Unchanged |
| Identity name + stance | kernel | Author's preference |
| Truth gate (4 questions, HARD GATE) | kernel | Core |
| Plain language (HARD GATE) | kernel | Unchanged |
| Generation rules (load-bearing sentences, mechanism-naming, contract test, noun-swap) | kernel — condensed into Generation paragraph | Unchanged in substance |
| Sarcasm rules | kernel | Author's voice |
| Backstop violations (consultantspeak, padding, flattery, hedging) | kernel | Unchanged |
| Lean principle | kernel | Unchanged |
| Two-layer architecture (kernel + skills) | kernel — skills demoted to optional | Kernel must stand alone; skills untested |
| Compression prohibition (LOCKED) | kernel — verbatim | It produced this document |
| Token ordering (LOCKED) | **retired:evidence** | Ordering is convention, not mechanism (v21.1 correction + experiment) |
| CONTINUE [topic] protocol | kernel — condensed into State | Still useful |
| Lessons / tasks/lessons.md (HARD GATE) | kernel | Proved itself this session |
| Skill discovery protocol (frontmatter scan, kernel_compat) | **skill:optional** (`eos-memory-mgmt`) | Kernel no longer mandates skills |
| Context Lens axis (1–5) | **retired:evidence** | Format-level control on a refuted premise; never tested |
| Sim-depth axis (1–7) | **retired:evidence** | Same; adversarial self-test survives as ad-hoc practice, not a numbered axis |
| Rule 1 Goal Lock | kernel — Rule 1 | Unchanged in substance |
| Rule 2 Generation Frame: generate from USER MODEL | kernel — folded into USER MODEL + Generation | Experiment-supported core |
| Rule 2: trajectory enumeration (mandatory, all paths) | **retired:evidence** — replaced by "recommend one path, fewest assumptions" | Enumeration theater; recommendation duty kept |
| Rule 2: recommendation duty (no lists without a pick) | kernel — Rule 2 | Unchanged |
| Rule 2: assumption handling (falsification criteria, HARD GATE) | kernel — Rule 2 | The framework's best idea |
| Rule 2: constraint classification (Hard/Structural/Assumed) | kernel — Rule 2 | Unchanged |
| Rule 2: confidence tiers (H/M/L by open assumptions) | kernel — Rule 2 | Unchanged |
| Rule 2: verification pre-flight | kernel — Rule 2 | Unchanged |
| Rule 2: Protocol 0 (THINK / suspend on undefined causality) | kernel — Rule 2, one line | Unchanged |
| Rule 2: source reconnaissance (HARD GATE) | kernel — Rule 2, one line | Unchanged |
| Rule 2: frame challenge / consolidation / dependency tracing / recursive input detection / context match | **skill:optional** (`eos-rules-reference`) | Sub-behaviors of elicitation; kernel keeps the spirit via truth gate |
| Rule 3 CCI / CCI-G percentage | **retired:evidence** | Confabulated number; no instrument. Replaced by countable `assump:N` + derived `conf` |
| Rule 4 Contradiction + Position Integrity | kernel — Rule 3 | Proved itself this session |
| Rule 5 Regression Lock | kernel — Rule 4 | Unchanged |
| Rule 6 Autonomy tiers + subagent boundaries | **skill:optional** (`eos-multi-agent`) + one workflow line (cost approval) | Rarely load-bearing in kernel |
| Rule 7 User Authority + precedence | kernel — Authority & precedence line | Condensed |
| Rule 8 Elicitation (scaffolded entry, probes, two-path offers, verbatim adoption, closure, pattern extraction) | **skill:optional** (`eos-rules-reference`) | Valuable but never measured; kernel keeps partner stance |
| Rule 9 Context monitor (70%/90% thresholds) | **retired:platform** | Claude Code compacts and summarizes natively; Notion decision-lock writes continue regardless |
| Rule 10 Output Integrity (noun-swap, header present) | kernel — Rule 5 | Experiment operationalized noun-swap as portability; it worked |
| Runtime header (7 fields) | kernel — rebuilt with 4 fact-based fields | lens/sim-d retired with axes; CCI-G/tds/ltm had no instrument |
| Header warning lines | kernel — 2 warnings | Rebased on fact fields |
| Builder mode | kernel | In use (this release was built under it) |
| Situational awareness | kernel — one line | Condensed |
| State: Notion Tier A authoritative | kernel — State | Unchanged |
| State: Pieces LTM Tier B | **skill:optional** (`eos-memory-mgmt`) | Supplementary; Notion wins conflicts anyway |
| State: Tier C native (auto-memory, summaries) | kernel — State | Updated for platform reality in v21.1 |
| State persistence hooks (PreCompact/SessionStart/SessionEnd) | unchanged in `hooks/` — kernel references them as fallback | Platform overlap noted; still the schema-controlled copy |
| Safety/quality hooks (credential-guard, file-backup, search-year-fix) | unchanged in `hooks/` | Independent of kernel |
| Workflow orchestration (plan mode, todo/lessons, verify-before-complete) | kernel — condensed | Practical, in daily use |
| 22 skill files | remain in `skills/` as **optional extensions** | Untested individually; pruning is future work, per-skill, with evidence |

**Net:** kernel 270 → ~100 lines. Nothing was silently dropped; every retirement above is reversible by putting the row back.
