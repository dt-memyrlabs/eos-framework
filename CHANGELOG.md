# Changelog

All notable changes to EOS are documented here.

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
