# Changelog

All notable changes to EOS are documented here.

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

## Known Technical Debt

| Issue | Affected Skills | Severity | Target |
|-------|----------------|----------|--------|
| `create_pieces_memory` used as primary write target (should be Notion per v20) | eos-collaboration, eos-goal-framing, eos-project-mgmt, eos-cold-start | Medium | v20.2.0 |
| `kernel_compat: "v20.0.0"` on 15 skills (kernel is v20.1.0) | All except recall-router, fact-check, voice-extract | Low | v20.2.0 |
