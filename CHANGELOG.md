# Changelog

All notable changes to EOS are documented here.

## v20.5.0 — 2026-03-25

### Added
- **Cross-session lessons (eos-metacognition F4)**: File-based self-correcting rules via `tasks/lessons.md`. Written immediately on correction, loaded at session start as behavioral constraints. 3+ cross-session occurrences escalates to F3 or kernel-updater. No external dependency.
- **Patch churn detection (eos-kernel-updater Step 1.5)**: 3+ patches on same rule triggers STRUCTURAL_REVIEW instead of incremental patch. Loads per-rule patch history from Notion.
- **F3 anti-churn check (eos-metacognition F3)**: 2+ prior patches on same rule = escalate to STRUCTURAL_REVIEW.
- **Constraint minimization query (eos-constraint-graph G2.6)**: Minimum constraint relaxation set for goal. Integrates with sim-depth 6 Monte Carlo and C7 Limiter Analysis.
- **Outcome tracking wiring (eos-project-mgmt C5)**: Auto-captures predictions, matches outcomes, runs accuracy analysis at 5+ entries.
- **M2 prediction/outcome events (eos-memory-mgmt M2)**: Two new decision-lock event types.
- `cross_session_lessons`, `outcome_tracking`, `patch_churn_detection` runtime parameters

### Changed
- **Cross-layer voice dedup (eos-voice-extract V2)**: Deduplication queries all populated layers before writing.
- **C7 minimization integration (eos-project-mgmt C7)**: Limiter Analysis queries G2.6 minimization when constraint graph is active.
- **PATTERN REGISTRY**: Demoted from Notion Spoke to supplementary. Primary store is `tasks/lessons.md`.
- **Changelog removed from kernel**: Moved to Notion (EOS Changelog page). Kernel was carrying ~130 lines of history that consumed tokens every session without influencing generation.

## v20.4.0 — 2026-03-24

### Added
- **Early warning detection (eos-metacognition F0)**: Passive monitor firing every response when goal locked. 7 signal types. 2+ signals auto-escalate to F1.
- **Contradiction pattern mining (eos-contradiction C7)**: Extracts hidden constraints from rejection patterns. Four pattern types. Max 2 presentations per session.
- **Cross-agent validation (eos-multi-agent Phase 3.5)**: Post-deployment, pre-consolidation. 4 cross-agent conflict types.
- **Reconciliation audit (eos-multi-agent Phase 4.5)**: Post-consolidation, pre-presentation. 4 audit checks. PASS/FAIL gate.
- **Skill compatibility breach protocol (eos-memory-mgmt M1.5)**: 4 breach types with severity-based responses.
- `cross_agent_validation`, `reconciliation_audit`, `early_warning`, `contradiction_mining`, `skill_breach_protocol` runtime parameters

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
