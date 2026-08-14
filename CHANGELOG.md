# Changelog

All notable changes to EOS are documented here.

## v22.5.0 — 2026-08-09

### Added

- **STE output gate (HARD GATE)**: all responses follow the ASD-STE100 writing rules — active voice, sentence length caps (20 words per instruction, 25 per description), one instruction per sentence, one topic per paragraph, simple verb forms, no idiom/slang/noun clusters over 3 nouns, warnings before the instructions they apply to. The approved-word dictionary is not shipped; only the writing rules apply. Shipped by user-authority override with no eos-test run, and recorded as such per the Measured delta rule. Open assumption: STE rules improve output clarity for the user. Falsification: the user reports lower clarity or asks for removal.

### Changed

- **Measured delta rule** now states explicitly that user-authority overrides are recorded as overrides with their assumption left open, rather than passing as tested changes.

## v22.4.1 — 2026-07-17

### Changed

- **Named lens restored to the runtime header by user decision** (user authority overrides defaults): `[lens:name] [goal:locked|open] [assump:N] [conf:H/M/L] [pos:held/moved|basis]`. The lens VALUE is a stateable fact (what layer of work the response claims to operate on) and is user-steerable via the hook; whether declaring it improves output remains the open assumption registered in v22.4.0. Not a reinstatement of the retired 1–5 numeric axis. Shipped without a harness run on explicit user authority; the eos-test A/B remains the registered falsification path.

### Fixed

- This entry itself: the v22.4.1 code shipped in a3fc85d without its changelog entry — a CRLF-vs-LF anchor mismatch made the insertion silently no-op while its verification check passed on a -1 indexOf. Recorded here as a lesson in instrument honesty.


## v22.4.0 — 2026-07-17

Merge of the two account lines. This repo's main had shipped its own "v21.1.0" (2026-07-17, hooks release) unaware of this line's v21.1.0→v22.3.0 run; that release is folded in here and its version number retired — this line's v21.1.0 (truth-gate, 2026-07-14) stands as the canonical v21.1.0.

### Fixed

**The state hooks never worked — including in v22.3.0, whose audit missed both bugs.** The v22.3.0 audit concluded "all six hook scripts do what their documentation claims" and noted only the python3 PATH requirement. Two deeper failures, found independently on main:

1. **Wrong output field (all platforms).** The bash state hooks injected via `systemMessage`, which only displays text to the human. The field that reaches model context is `hookSpecificOutput.additionalContext`. State recovery could not function through `systemMessage` anywhere — the headline persistence feature was inert as shipped.
2. **python3 is not just a PATH requirement (Windows).** `python3` commonly resolves to the Microsoft Store stub, which prints "Redirecting..." and opens the Store. The hooks ran and silently produced garbage rather than failing loudly.

All three bash state hooks replaced by `hooks/eos-hook.js` — one cross-platform Node dispatcher (modes: `prompt` | `session-start` | `pre-compact` | `session-end`), registered in `hooks-settings.json`. Requires Node only. Backup pruning: pre-compact keeps 20, session-end keeps 10.

### Added

- **Per-prompt state injection (UserPromptSubmit).** The state file + v22 header mandates arrive in model context on every prompt. Prompt-text rules fire only when the model attends to them; hook-delivered rules always arrive. This is infrastructure, not a behavior claim — no measured-delta run required; the injected *content* is the already-shipped v22 kernel mandates.
- **Optional lens steering (untested hypothesis).** `lens: <name>` anywhere in a prompt persists a free-form layer-of-work label to the state file and injects a generate-under-this-lens instruction before the model reads the message; `lens: off` returns the choice to the model. Explicitly outside the v22 header (which stays `[goal] [assump] [conf] [pos]`). No claim of measured benefit — the mechanism is deterministic, the value is an open hypothesis with a registered falsification path: `tools/eos-test` A/B, lens-steered vs unsteered, same battery. Position-dominance is not the claimed mechanism (refuted 2026-07-14); explicit instruction is.

### Notes

- Kernel text change is one line (state section now names the dispatcher). Header, axioms, rules untouched.
- The superseded main-line release also renamed the numeric lens axis to "Displacement Dial" across v21-era docs; v22 had already banner-ed those docs as historical, so v22's versions stand and the rename is recorded here only for the record.


## v22.3.0 — 2026-07-15

Full-repo pass. Every file in the repo has now been read end-to-end (previous releases were change-driven — files were read when touched). Findings and corrections:

### Fixed
- **`hooks-settings.json` never installed the state hooks.** It only wired the three PreToolUse safety hooks; the PreCompact/SessionStart/SessionEnd hooks that headline v21 were absent, so a user following the documented install never got them. All six now wired.
- **`docs/` contradicted v22 in place.** `architecture.md` presented the refuted attention-ordering theory as established mechanism; `quick-start.md` and `installation.md` install the v20 stack ("all 18 skills should report OK", lens/sim controls, the old header); the 10 rule docs and 4 concept docs describe retired machinery. All 18 files now carry historical banners — `architecture.md`'s banner names exactly which claims were refuted and which (displacement-vs-suppression, attractor-basin naming) remain untested hypotheses.
- **`CONTRIBUTING.md` updated** — measured-delta rule added, token-ordering demoted from mechanism to convention, dead `skill_versions` registry reference removed, v22 skill standards stated.

### Changed
- **eos-multi-agent verdict revised; Phases 3.5–4.5 extracted as `eos-feedback-loops` L6.** The v22.2.0 changelog called eos-multi-agent platform-superseded. Reading all 440 lines shows that is true for its orchestration mechanics (spawn templates, dollar budgets, loop detection) but wrong for its epistemic layer: output-as-data, cross-agent contradiction detection, and the reconciliation audit (synthesis claims must trace to agent findings; synthesis confidence capped at the minimum constituent confidence) are feedback loops, and they now live in eos-feedback-loops L6.
- **Two v22.2.0 skill verdicts refined on full read:** eos-report is not "generic" — it is a competent synthesis skeleton tightly coupled to retired v21 state (verdict: legacy stands, reason corrected). eos-memory-mgmt M1.1 ("load deferred MCP tools before tier detection — passive inventory checks falsely classify Tier C") is a correct and non-obvious operational insight worth preserving when that skill is ever revalidated.

### Audited, no change needed
- All six hook scripts do what their documentation claims. Scope notes added to hooks/README: the Write/Edit guards don't intercept Bash-driven file mutations; state hooks require python3 on PATH.
- LICENSE (Apache 2.0), .gitignore, examples/ — consistent; `examples/memory/feedback_prior_dominance.md` still teaches the v20 framing and inherits the docs banner caveat by reference.

## v22.2.0 — 2026-07-14

Skill content audit and consolidation. The 22 legacy skills were read for substance (not just scanned for stale references, as in v22.1.1). Verdict: four distinct, keepable ideas; the rest control machinery, platform-superseded, or generic.

### Added
- **`skills/quality/eos-feedback-loops.md`** — the first v22-native skill (kernel_compat v22). Consolidates the four survivors: L1 rejection pattern mining (from eos-contradiction C7), L2 prediction ledger with accuracy review + L3 reversibility tags (from eos-project-mgmt C5/C2), L4 correction-ledger schema with countable cross-session escalation (from eos-metacognition F4), L5 invitation-over-extraction probe technique (from eos-dimension-ambiguity). Plus two standing questions preserved from otherwise-retired files: the feasibility thesis (goal-framing B2b) and the skip test (tangent-drift-score EVR).
- New ledger files: `tasks/predictions.md` (L2) alongside `tasks/lessons.md` (L4 schema).

### Notes
- Source skills remain in place as legacy (unchanged since v22.1.1 marking). eos-feedback-loops supersedes their live use; they stay for provenance until individually retired.
- The audit's common thread, recorded for the record: everything that survived — in the kernel and now in the skills — is a feedback loop; everything cut was control machinery.

## v22.1.1 — 2026-07-14

Skill-layer audit. Prompted by the question "did you review the skills?" — the honest answer was no, and the audit found the skill layer was stale before v22 existed: 17 of 22 skills still declared v20.x `kernel_compat`, and the validator had been silently broken since the kernel dropped its `skill_versions:` line.

### Fixed
- **`tools/validate-skills.sh` rewritten (v22-aware).** The old script depended on a kernel `skill_versions:` line removed in the v21-slim fork and died silently under `set -e` before printing its own error. New version checks frontmatter, compares `kernel_compat` major to the kernel, greps for v21-retired machinery, and always reports a summary. Current output: 0 ok, 22 legacy, 0 structural.

### Changed
- **14 skills marked legacy in-file** (`v22 status: legacy` notice after frontmatter): cold-start, goal-framing, project-mgmt, memex, memory-mgmt, report, metacognition, tangent-drift-score, constraint-graph, dimension-ambiguity, lens-simdepth, rules-reference, kernel-updater, runtime-params. Each references retired machinery (lens/sim-depth, CCI, v21 rule numbering); loading one may reintroduce retired behavior. The other 8 are clean of retired references but still declare stale `kernel_compat`.
- README Known Issues updated to state the skill layer's true condition.

Promotion path for any skill: revalidate content against the v22 kernel, test with `tools/eos-test` where the claim is measurable, then bump `kernel_compat`.

## v22.1.0 — 2026-07-14

### Added
- **`tools/eos-test` — the falsification harness.** The v22 experiment turned into a reusable rig: any two context variants, any task battery, blind judges, same scorecard (specificity / portability / quality / pollution). Pre-registration enforced in code (refuses to run without hypothesis + criteria; both echoed into results so goalposts can't move). `dryRun` mode returns agent count and token estimate (~45k/agent, measured) with zero spend. Validated by dry run: 8 tasks × 2 judges → 32 agents, ~1.44M tokens, as designed.
- **`tools/task-battery.default.json`** — the 8 experiment tasks as a starting battery, with instructions to substitute your own.
- **`tools/eos-test.md`** — usage, cost table, the enforcement discipline, and inherited limitations.

### Changed
- **Kernel: measured-delta rule (LOCKED).** Kernel changes now ship with a harness result — dry-run estimate first, approved spend, pre-registered criteria, both outcomes published. Version bumps are experiment outcomes.

## v22.0.0 — 2026-07-14

Evidence release. The falsification test registered in v21.1 was run the same day (docs/experiments/2026-07-14-user-model-falsification.md); v22 is the framework cut to what the results support. Full v21.1 → v22 disposition of every named behavior, per the compression prohibition: docs/v22-behavior-map.md.

### Evidence
- **Registered test supported (11/12):** populated USER MODEL beat no context on specificity (7.9 vs 3.3) at no quality cost (8.5 vs 8.0), zero pollution, 0% vs 67% noun-swap portability.
- **Structured format refuted (14/16):** identical facts as plain prose beat the EOS labeled-field USER MODEL on both specificity and quality.

### Changed
- **Kernel rewritten: 270 → ~100 lines.** Two axioms, prose USER MODEL, identity, five rules (Goal Lock; Grounding; Contradiction & Position Integrity; Regression Lock; Output Integrity), fact-based header, lessons, builder mode, state, workflow discipline. Kernel now stands alone — no skill dependency.
- **USER MODEL format: labeled fields → prose**, per the 14/16 result. The old field names survive as an authoring checklist in the template note.
- **Runtime header rebuilt on stateable facts:** `[goal] [assump:N] [conf] [pos]`. Goal state and position are facts; the assumption count is countable; confidence is a declared mapping from it.

### Retired (all reversible; see behavior map)
- **Context Lens and Simulation Depth axes** — untested control machinery on a refuted format premise.
- **CCI / CCI-G percentage** — no instrument behind the number; violated "never fabricate numbers."
- **Mandatory skill system** — the 22 skills remain in skills/ as optional, individually unvalidated extensions.
- **Rule 9 context thresholds** — Claude Code compacts and summarizes natively; Notion decision-lock writes continue regardless.
- **Trajectory-enumeration mandate** — replaced by the recommendation duty (one path, fewest assumptions).

## v21.1.0 — 2026-07-14

Truth-gate release. Two claims in v21.0.0 failed the framework's own Axiom 2 when audited by the model the framework runs on. Both are corrected rather than defended.

### Changed
- **Kernel synced with the maintained live version (v21.1-slim).** The published v21.0.0 kernel had drifted 350+ diff lines from the operating kernel (two-axiom restructure, workflow orchestration section, elicitation rule rewrite). The repo kernel is now byte-identical to the live one and gains the v21.1 corrections below.
- **Mechanism claim corrected (README + kernel USER MODEL).** v21.0.0 claimed displacement came from attention-window ordering — user context placed first dominates downstream generation. Wrong as stated: causal attention means later tokens attend to the whole prefix, no position grants dominance, and the kernel sits behind the platform's own system prompt and tool definitions regardless. The corrected, testable claim: displacement comes from context **specificity**, not position. USER MODEL-first ordering survives as a reading/maintenance convention. Falsification criterion added to README.
- **Runtime header reframed: self-check protocol, not telemetry.** v21.0.0 said "this is not decoration — each field is a live diagnostic." The values are model-generated estimates with no measuring instrument behind them; presenting them as diagnostics violated the "never fabricate numbers" belief. Function is preserved and stated honestly: the header forces per-response attention to goal convergence, open assumptions, position integrity, and drift. Read trends, not absolute values.
- **Sim-depth 6 renamed: Monte Carlo → Constraint Sweep.** The model does not run stochastic simulation; it enumerates constraint relaxations in prose. The old name failed Rule 10's noun-swap test. Renamed in README, `eos-lens-simdepth`, `eos-constraint-graph`, and `docs/concepts/simulation-depth.md`. Historical changelog entries left as written.
- **State Storage Tier C updated (kernel).** Claude Code now ships native auto-memory (`MEMORY.md` + memory files) and compaction-surviving summaries. Tier C is no longer "conversation history only." Noted in kernel Rule 9 and README Known Issues: this overlaps the v21 state hooks, which remain the schema-controlled durable copy.
- **Kernel size figures corrected** throughout README: ~270 lines / ~3,400 tokens (was stated as ~176 lines / ~2,800 tokens against a kernel that no longer matched).

### Known Issues
- **Platform absorption.** Claude Code's native memory and compaction summaries will keep eating the state-persistence machinery. The durable core of EOS is the behavioral ruleset (falsification discipline, goal lock, regression lock, noun-swap test), not the plumbing. Future versions should shrink accordingly.

## v21.0.0 — 2026-04-02

### Architecture

**Architectural fork for Claude Code compaction survival.** Based on analysis of Claude Code's 7-layer memory architecture (tool result storage, microcompaction, session memory, full compaction, auto memory extraction, dreaming, cross-agent communication), EOS v21 is restructured to persist runtime state through context compaction events.

**Problem:** Claude Code aggressively compresses context when approaching token limits. The kernel reloads via SessionStart hooks, but conversation-specific state (locked variables, CCI-G, constraint graph, position history, regression locks) was destroyed on every compaction.

**Solution:** Slim core + on-demand modules + PreCompact/SessionStart hooks for state persistence.

### Added
- **PreCompact hook (`eos-precompact.sh`)**: Fires before context compaction. Backs up EOS state file, injects recovery instructions as systemMessage. Detects stale state (>5min) and warns.
- **SessionStart hook (`eos-session-start.sh`)**: Fires on session start and post-compaction reload. Injects state file content as systemMessage for immediate recovery without requiring a file read.
- **SessionEnd hook (`eos-session-end.sh`)**: Final backup of state file on session close.
- **State file (`~/.claude/eos-state/current-state.json`)**: Continuous persistence of runtime state. Schema covers: active goal, locked variables, CCI-G, lens, sim-depth, position history, constraint classifications, regression locks, assumptions, open threads.
- **Continuous write protocol**: Model writes state file on every state-change event (Tier 1 autonomous). One write per response maximum.
- **STATE RECOVERY BLOCK** in kernel: Instructions for post-compaction state recovery with session matching and Notion Spoke fallback.
- **`eos-rules-reference` skill** (reasoning/): Full verbose text of Rules 1-10 with all edge cases, examples, constraint classification table, assumption handling, simulation scaling, source reconnaissance, Protocol 0.
- **`eos-lens-simdepth` skill** (reasoning/): Context Lens (1-5) and Simulation Depth (1-7) reference tables with combined control explanation. Loaded on "lens X", "sim X", "depth X".
- **`eos-runtime-params` skill** (system/): Full runtime parameters reference block. Loaded on explicit request.
- **`eos-autonomy-boundaries` skill** (system/): Subagent execution boundaries, tool budget enforcement, data flow scoping. Loaded when eos-multi-agent active.
- **M4.1 in eos-memory-mgmt**: Local state file write protocol alongside Notion writeback policy.

### Changed
- **Kernel compressed: 545 lines / 43.7KB → 176 lines / 10.6KB** (75.7% byte reduction, ~70% token reduction). Every named behavior mapped to slim core or skill file per compression prohibition protocol.
- **Rules 1-10**: Compressed to 2-3 line summaries in kernel with HARD GATES preserved. Full text moved to `eos-rules-reference` skill.
- **Context Lens and Simulation Depth tables**: Moved from kernel to `eos-lens-simdepth` skill.
- **Runtime Parameters block**: Moved from kernel to `eos-runtime-params` skill.
- **Subagent boundary tables**: Moved from kernel to `eos-autonomy-boundaries` skill.
- **STATE STORAGE section**: Removed from kernel (was duplicate of eos-memory-mgmt M5). Single source of truth in eos-memory-mgmt.
- **eos-memory-mgmt v1.4.0 → v1.5.0**: M4.1 added for state file protocol. kernel_compat bumped to v21.0.0.

### Token Budget Impact
- Always-loaded kernel: ~10,400 tokens → ~2,800 tokens (-7,600 tokens)
- State file recovery: +500-800 tokens (on-demand)
- Net gain: ~6,800 tokens of freed working context before compaction triggers
- On-demand skill files compete with 25K skill injection budget, not always-loaded budget

### Learned from
Troy Hua's reverse-engineering of Claude Code's leaked harness revealed the 7-layer memory architecture. Key insight: EOS assumed stable persistent context; Claude Code assumes disposable context with aggressive compression. The architectural fork adapts EOS to mirror Claude Code's own memory pattern (slim index always loaded, full content on-demand, background consolidation).

---

## v20.5.0 — 2026-03-24

### Added
- **Cross-session lessons (eos-metacognition F4)**: File-based via `tasks/lessons.md`. Self-correcting rules written immediately on correction, loaded at session start as behavioral constraints. 3+ cross-session occurrences escalates to F3 or kernel-updater. No external dependency — works without Notion. Notion PATTERN REGISTRY retained as supplementary backup.
- **Patch churn detection (eos-kernel-updater Step 1.5)**: Loads per-rule patch history from Notion kernel update log before classifying proposals. 3+ patches on same rule triggers STRUCTURAL_REVIEW classification — proposes architectural redesign direction instead of another text diff.
- **F3 anti-churn check (eos-metacognition F3)**: Before proposing any rule patch, queries patch history. 2+ prior patches on same rule = escalate to kernel-updater STRUCTURAL_REVIEW instead of proposing incremental patch. Prevents metacognition from contributing to churn.
- **Constraint minimization query (eos-constraint-graph G2.6)**: Finds minimum set of constraints to relax to reach goal. Ranks by classification softness, cascade risk, goal-distance impact. Integrates with sim-depth 6 Monte Carlo and C7 Limiter Analysis. Tier 1 read-only query.
- **PATTERN REGISTRY Spoke section (eos-memory-mgmt M5)**: Demoted to supplementary backup. Primary store is `tasks/lessons.md`.
- **M2 prediction/outcome events (eos-memory-mgmt M2)**: Two new decision-lock event types for OUTCOME LOG writes.
- `cross_session_lessons`, `outcome_tracking`, `patch_churn_detection` runtime parameters
- **`tasks/lessons.md`**: New file. Schema for cross-session lesson tracking. Read by F4 at session start, written on every correction.

### Changed
- **eos-metacognition v1.1.0 → v1.2.0**: F4 rewritten — file-based `tasks/lessons.md` replaces Notion PATTERN REGISTRY as primary store. Lessons written immediately on correction, not batched. F3 anti-churn check added. Description and autonomy section updated.
- **eos-project-mgmt v1.1.1 → v1.2.0**: C5 expanded from 8-line stub to full operational outcome tracking (C5.1 prediction capture, C5.2 outcome capture, C5.3 accuracy analysis). C7 Limiter Analysis enhanced with G2.6 minimization query integration.
- **eos-constraint-graph v1.0.0 → v1.1.0**: G2.6 minimization query added. Cross-reference to C7 updated.
- **eos-voice-extract v1.0.0 → v1.1.0**: V2 deduplication upgraded from auto-memory-only to cross-layer (checks auto-memory, Notion, Pieces via recall-router cross_layer query). Four outcome types: exact duplicate, evolution, cross-layer duplicate, new.
- **eos-kernel-updater v1.0.0 → v1.1.0**: Step 1.5 (patch history loading) and STRUCTURAL_REVIEW classification added. Step 5 logging enhanced with patch counts.
- **eos-memory-mgmt v1.3.0 → v1.4.0**: M2 table expanded with prediction/outcome events. M5 Extended Sections expanded with PATTERN REGISTRY.
- **Changelog removed from kernel**: Moved to Notion (EOS Changelog page). Kernel trimmed from 672 to 543 lines.
- All modified skills: `kernel_compat` bumped to v20.5.0.

### Learned from
Gap analysis of v20.4.0: in-session metacognition strong but cross-session learning absent (same mistakes recur without detection), rule patches accumulate without structural review (tuning ≠ fixing), constraint graph missing optimization queries (can describe but not minimize), voice extract deduplicates within auto-memory but not across layers (fact proliferation), OUTCOME LOG exists in Spoke schema but nothing writes to it (predictions never compared to reality).

---

## v20.4.0 — 2026-03-24

### Added
- **Early warning detection (eos-metacognition F0)**: Passive monitor firing every response when goal is locked. 7 signal types: confidence decay, assumption accumulation, CCI-G stall, trajectory churn, constraint promotion failure, user correction clustering, regression near-miss. Single signal = log internally. 2+ signals = auto-escalate to F1 diagnostic. Anti-noise exclusions for first 3 exchanges, builder mode, and lens/sim-depth changes.
- **Contradiction pattern mining (eos-contradiction C7)**: Auto-extracts hidden constraints from rejection patterns in contradiction history (C5). Four pattern types: common constraint, common survivor, escalation consistency, override clustering. Confirmed patterns promote to constraint registry and feed back into Rule 2 simulation, USER MODEL, and F0 early warning resolution. Max 2 presentations per session.
- **Cross-agent validation (eos-multi-agent Phase 3.5)**: Post-deployment, pre-consolidation structural gate. Detects 4 cross-agent conflict types: scope overlap mutation (two agents mutated same resource), contradictory findings (same subject, opposite claims), stale dependency (Agent A assumes state that Agent B invalidated), circular recommendation (mutual precondition deadlock). Produces structured validation report. Conflicts must resolve before Phase 4 synthesis.
- **Reconciliation audit (eos-multi-agent Phase 4.5)**: Post-consolidation, pre-presentation structural gate. 4 audit checks: evidence tracing (every synthesis claim must trace to agent finding), omission detection (H-confidence findings missing from synthesis), contradiction honoring (escalated contradictions must appear with resolution), confidence inflation (synthesis confidence cannot exceed constituent minimum). PASS/FAIL gate.
- **Skill compatibility breach protocol (eos-memory-mgmt M1.5)**: Operationalizes "compression violation until resolved" for incompatible skills. 4 breach types: minor version behind (warn + load), major version behind (disable + notify), missing frontmatter (disable + notify), future version (warn + load). Bulk compatibility report at >3 incompatible. Integration with eos-kernel-updater for post-upgrade re-scan.
- `cross_agent_validation`, `reconciliation_audit`, `early_warning`, `contradiction_mining`, `skill_breach_protocol` runtime parameters
- Skill discovery protocol extended with breach protocol (step 6)

### Changed
- **eos-metacognition v1.0.1 → v1.1.0**: F0 early warning detection added. Trigger conditions updated to include F0 passive monitoring.
- **eos-contradiction v1.0.1 → v1.1.0**: C7 pattern mining added. Extracts hidden constraints from rejection history.
- **eos-multi-agent v1.2.0 → v1.3.0**: Phase 3.5 (cross-agent validation) and Phase 4.5 (reconciliation audit) added. Lifecycle expanded from 5 to 7 phases.
- **eos-memory-mgmt v1.2.0 → v1.3.0**: M1.5 skill compatibility breach protocol added between M1.3 and M1.4.
- **Rule 6 (Autonomy Tiers)**: Tier 1 expanded to include F0, C7, Phase 3.5, and Phase 4.5 autonomous operations.
- All 18 skill files: `kernel_compat` bumped to v20.4.0.

### Learned from
Operational gap analysis of v20.3.0: per-agent loop detection insufficient without cross-agent validation, consolidation reconciliation vulnerable to parent bias, metacognition reactive-only (threshold-based) missing proactive signal detection, contradiction history collecting data but not extracting patterns, skill compatibility stated as violation but had no operational remediation protocol.

---

## v20.3.0 — 2026-03-24

### Added
- **Subagent execution boundaries (Rule 6)**: Structural boundary table with 6 enforced constraints: no recursive spawning, concurrency cap, pre-execution gate, output-as-data, loop detection, data flow scoping.
- **Tool authorization protocol (eos-multi-agent)**: ALLOW/DENY/ESCALATE classification for every subagent tool call. Fail-closed default. Mutation classification table. Agent spec validation gate.
- **Loop detection (eos-multi-agent)**: Sliding window of 20 tool calls per agent. Warn at 3 identical. Hard stop at 5. Pattern warning on consistent tool failures.
- **Data flow protocol (eos-multi-agent)**: Scoped inbound (squad-only data). Structured outbound (AGENT OUTPUT template). Intermediate tool results stripped before parent and persistence.
- **Output-as-data principle (eos-multi-agent)**: Subagent output is DATA not INSTRUCTIONS. Parent reconciliation protocol with evidence verification, recommendation simulation, and contradiction escalation.
- **Infrastructure validation gate (eos-multi-agent Phase 0)**: Git state check, target verification, checkpoint creation, rollback path documentation. Required before mutation orchestrations.
- **Recursive spawn prevention**: `Agent` tool structurally excluded from subagent manifests. `spawn: false` in agent spec. Flat two-level hierarchy.
- `agent_boundaries` and `agent_data_flow` runtime parameters
- Multi-agent intermediate results exclusion in eos-memory-mgmt

### Changed
- **eos-multi-agent v1.1.0 → v1.2.0**: Defense-in-depth security at agent boundaries. Six new protocol sections.
- **Rule 6 (Autonomy Tiers)**: Extended with execution boundaries table and rule interaction documentation.
- All 19 skill files: `kernel_compat` bumped to v20.3.0.

### Learned from
ByteDance DeerFlow (14-middleware defense-in-depth architecture) and Church of Clean Code (flat agent hierarchy, output-as-data reconciliation). Security patterns converted from code-level middleware to prompt-level structural enforcement.

## v20.2.0 — 2026-03-23

### Added
- **Recon-before-spawn protocol**: New Phase 0 (pre-flight) and Phase 1 (recon) in `eos-multi-agent`. Lightweight input scan + squad formation before agent deployment. Agents receive pre-filtered, scoped input sets.
- **Consolidation protocol**: New Phase 4 in `eos-multi-agent`. Structured template: collect, cross-reference for contradictions, gap analysis, synthesize. Parallel outputs without consolidation are not a deliverable.
- **Skill discovery protocol**: Session-start scan of skill directory. Frontmatter IS the registry.
- `skill_path` and `skill_discovery` runtime parameters

### Changed
- **`eos-multi-agent` v1.0.0 → v1.1.0**: Full rewrite. 5-phase lifecycle (pre-flight, recon, decomposition, deploy, consolidate). Declarative tool manifests with structural enforcement.
- **Tool budget**: Advisory rule ("4-5 per subagent") → structural enforcement. No tool list = spawn rejected. >5 = warning. >8 = hard block.
- **Skill file naming**: Version removed from filenames. Version lives in frontmatter `version` field only — single source of truth, eliminates filename/frontmatter drift.
- **Skill frontmatter standard**: All skills now carry `state` field (trigger-ready, auto-monitor, active-when-X). All `kernel_compat` updated to v20.2.0.

### Removed
- `skill_versions` runtime parameter — replaced by per-file frontmatter `version` field
- `module_state` runtime parameter — replaced by per-file frontmatter `state` field

### Learned from
Church of Clean Code parallel agent architecture. Four structural patterns independently arrived at by Church that exposed gaps in EOS where operational patterns existed as rules (advisory) rather than structure (enforced).

## v20.1.0 — 2026-03-19

### Added
- **Simulation Depth axis (sim-d:1-7)**: Second control dimension independent of Context Lens. Controls trajectory enumeration depth and adversarial pressure.
  - Depth 5: Adversarial — generate strongest counterargument, recommendation must survive
  - Depth 6: Monte Carlo — constraint graph sweep, simulate relaxing each locked constraint
  - Depth 7: Exhaustive — all of above combined, maximum compute
- `sim-d` field in runtime header
- Three new skills: `eos-recall-router`, `eos-fact-check`, `eos-voice-extract`

### Changed
- Runtime header extended: `[lens:X] [sim-d:X] [CCI-G:X%|n/a] [sim:H/M/L] [pos:held/moved|basis] [tds:on/off] [ltm:X|—]`

## v20.0.0 — 2026-03-15

### Changed — Architectural Shift
EOS v20 is a **context-staging system**, not a rule-filtering system. The weights are the engine — rules steer by shaping what they pattern-complete from, not by auditing what they produce.

### Added
- **USER MODEL** as Position 1 in token ordering — all downstream tokens attend to it first
- **Context Lens (1-5)**: user-controlled dial from full displacement to raw prior output
- **Attractor basin naming**: one-line naming of conventional output satisfies the pattern so weights move past it
- **Constraint classification**: Hard / Structural / Assumed with promotion/demotion mechanics
- **State Storage tiers**: Tier A (Notion), Tier B (Pieces LTM), Tier C (Claude native)
- **Lean Thinking** integrated into Identity and Simulation
- Skills: `eos-kernel-updater`, `eos-constraint-graph`, `eos-memex`, `eos-multi-agent`

### Absorbed from v19 (compression audit)
- Prior Inversion → attractor basin naming + lens dial
- F0 diagnostic → USER MODEL positioning + noun-swap test
- Conventional framing prohibition → Generation Frame + lens dial
- Occam's Razor → integrated into simulation ("fewest assumptions wins")
- Lean test → integrated into Identity + simulation
- Rule 10 8-point audit → upstream primes + noun-swap test
- CCI-F per-response → session-start only
- Simulation disclosure → confidence tag in header
- Identity prohibition statements → positive generation targets
- Tone check → Identity generation targets

No named behaviors were silently dropped. Full audit table in kernel.

---

*Technical debt items from earlier versions have been resolved. Pieces write targets fixed in v20.2.0. Skill kernel_compat aligned in v20.3.0.*
