# EOS -- Enlightened Operating System v20.5.0

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A prompt engineering framework that shapes Claude's behavior through structured context displacement.

---

## What is EOS?

Large language models generate from training priors by default. Every response pattern-completes from the statistical distribution the model learned during training. Rules and system instructions attempt to filter this output after the fact -- but the generation frame is already set before any rule fires.

EOS takes a different approach: **context-staging**. Instead of filtering outputs, EOS displaces the generation frame itself by loading specific user context into the attention window before anything else. The model's causal attention is unidirectional -- each token attends only to tokens before it. By positioning user-specific context (domain expertise, methodology, vocabulary, project state) ahead of identity declarations and rules, the weights pattern-complete from that context rather than from generic training priors.

The result: responses that reflect the user's actual operating environment instead of the model's parametric defaults.

### How it works

EOS has two layers:

1. **Kernel** (`CLAUDE.md`) -- loaded as system instructions. Contains the USER MODEL, identity declarations, architecture rules, and 10 operational rules. Token ordering is enforced: USER MODEL before Identity before Architecture before Rules.

2. **Skills** -- 18 modular files that activate on specific triggers (user keywords, state transitions, metric thresholds). Each skill has its own lifecycle and references kernel rules without duplicating them.

### What it looks like in practice

Every EOS response begins with a mandatory runtime header:

```
[lens:4] [sim-d:3] [CCI-G:65%] [sim:M] [pos:held|basis:constraint-graph] [tds:on] [ltm:2]
```

This is not decoration. Each field is a live diagnostic:

| Field | Meaning |
|-------|---------|
| `lens:4` | Context Lens setting -- how much training prior enters generation |
| `sim-d:3` | Simulation Depth -- trajectory enumeration depth |
| `CCI-G:65%` | Complete Context Index (Goal Progress) -- percentage toward goal convergence |
| `sim:M` | Simulation confidence -- HIGH / MEDIUM / LOW |
| `pos:held\|basis:...` | Position integrity -- whether the model held or moved its position, and why |
| `tds:on` | Tangent Drift Score -- active drift monitoring |
| `ltm:2` | Exchanges since last persistence write |

---

## Control Axes

EOS exposes two independent control axes that the user adjusts in conversation.

### Context Lens (1--5)

Controls the balance between training priors and user context in generation.

| Lens | Name | Behavior |
|------|------|----------|
| 1 | Raw Prior | Pure training distribution output. No displacement. Diagnostic mode. |
| 2 | Prior-Visible | Conventional output generated first, then user-context alternative alongside it. |
| 3 | Balanced | Both conventional and user-context paths fully developed and compared. |
| 4 | User-Led (default) | User context dominant. Convention named in one line, then bypassed. |
| 5 | Full Displacement | Maximum user context saturation. Convention gets zero tokens. |

### Simulation Depth (1--7)

Controls how many trajectories are explored and how hard each is tested.

| Depth | Name | Behavior |
|-------|------|----------|
| 1 | Surface | Single trajectory, confidence tag only. |
| 2 | Scan | Two trajectories, one failure mode each. |
| 3 | Standard (default) | All viable trajectories. One failure mode + one constraint test per path. |
| 4 | Deep | All trajectories. Two or more failure modes each. Assumptions stress-tested. |
| 5 | Adversarial | Generate strongest counterargument to recommendation. Survives or dies. |
| 6 | Monte Carlo | Constraint graph sweep. Simulate relaxing each locked constraint. |
| 7 | Exhaustive | All of the above. Every assumption falsification-tested. |

---

## Rules

EOS has 10 operational rules. Each handles a specific mechanical concern.

| # | Rule | Purpose |
|---|------|---------|
| 1 | Goal Lock | Goal is the only fixed point. Verified on frame shifts. Nothing starts without a clear goal. |
| 2 | Generation Frame | Generation starts from USER MODEL. Priors are reference data, not the generation seed. |
| 3 | CCI (Complete Context Index) | Living health indicator tracking goal progress and framework readiness. |
| 4 | Contradiction | Contradictions between user statements or system rules are flagged immediately. Position held until the argument changes, not the pressure. |
| 5 | Regression Lock | Resolved variables stay locked. No re-opening without new evidence. |
| 6 | Autonomy Tiers | Three tiers controlling what the system does autonomously vs. what requires user confirmation. |
| 7 | User Authority | User instructions override defaults. Hard limits are not overridable. Conflict resolution protocol. |
| 8 | Operational Empathy | Work on the problem with the user, not observe them working on it. Context-level probing over surface-level questions. |
| 9 | Context Limit Monitor | Tracks context window usage. 70% triggers state dump. 90% closes threads. |
| 10 | Output Integrity | Noun-swap test: if the output works for any user with different nouns, it is prior-derived. Regenerate from USER MODEL. |

---

## Skills

18 skill modules organized in 7 categories. Each activates on specific triggers and operates within kernel rule boundaries.

### Lifecycle
- `eos-cold-start` -- New project creation and initialization
- `eos-goal-framing` -- Goal extraction, feasibility thesis, dimension prioritization
- `eos-project-mgmt` -- Project state tracking, limiter analysis, C5 outcome tracking (prediction capture, matching, accuracy analysis)

### Build
- `eos-builder` -- Artifact-first output mode with condensed simulation

### Memory
- `eos-memory-mgmt` -- Persistence tier detection, Notion writeback policy, M1.5 skill compatibility breach protocol
- `eos-memex` -- Context compression with indexed archive and retrieval
- `eos-recall-router` -- Routes recall queries to the correct persistence tier with cross-layer dedup

### Reasoning
- `eos-contradiction` -- Dialectic contradiction handling, re-entry after rejection, C7 pattern mining (extracts hidden constraints from rejection history)
- `eos-constraint-graph` -- Constraint classification, dependency mapping, cascade unlocking, G2.6 minimization query (minimum constraint relaxation set)
- `eos-dimension-ambiguity` -- Handles ambiguous responses during dimension probing

### Quality
- `eos-metacognition` -- F0 early warning (passive 7-signal degradation monitor), F1-F2 diagnostics, F3 rule patching with anti-churn check, F4 cross-session lessons via `tasks/lessons.md`
- `eos-fact-check` -- Claim verification against available evidence
- `eos-voice-extract` -- Session voice extraction with V2 cross-layer deduplication (checks auto-memory, Notion, Pieces before writing)
- `tangent-drift-score` -- Goal drift detection with context-specific sarcastic redirects

### Output
- `eos-report` -- Structured deliverable generation with multi-source cross-referencing

### System
- `eos-collaboration` -- Multi-user session coordination and attribution
- `eos-multi-agent` -- 7-phase agent lifecycle: pre-flight, recon, decomposition, deployment, Phase 3.5 cross-agent validation, consolidation, Phase 4.5 reconciliation audit
- `eos-kernel-updater` -- Kernel self-modification with Step 1.5 patch churn detection (3+ patches on same rule triggers structural review)

---

## Operating Modes

### Builder Mode

Activated by "let's build," "start coding," or "build mode on." Output shifts to artifacts -- code, documents, deliverables. Clarifying questions suppressed except genuine blockers. Simulation condensed to one-line confidence notes. Runtime header still required.

### Situational Awareness

EOS operates as a persistent partner across all active work. On any task: checks the active project landscape, maps tasks to the right project, surfaces cross-project conflicts, triages random input to the right branch.

### Cross-Session Learning

`tasks/lessons.md` captures self-correcting rules from every user correction. Loaded at session start as behavioral constraints. Written immediately on correction (not batched). 3+ occurrences across distinct sessions escalates to structural review.

---

## Quick Start

### 1. Copy the kernel

```bash
cp kernel/CLAUDE.md ~/.claude/CLAUDE.md
```

### 2. Copy skills

```bash
cp -r skills/ ~/.claude/skills/
```

### 3. Validate

```bash
bash tools/validate-skills.sh
```

### 4. Start a conversation

Open Claude Code or claude.ai. EOS activates automatically. You will see a runtime header on every response and the system will ask for a goal before substantive work begins.

See [docs/quick-start.md](docs/quick-start.md) for a detailed walkthrough. See [docs/installation.md](docs/installation.md) for platform-specific setup.

---

## Structure

```
eos-framework/
  kernel/
    CLAUDE.md              # The kernel (~543 lines). System instructions loaded at session start.
  skills/
    lifecycle/             # Cold start, goal framing, project management
    build/                 # Artifact construction
    memory/                # Persistence, recall, knowledge graph
    reasoning/             # Contradiction, constraints, ambiguity
    quality/               # Metacognition, fact-check, voice, drift
    output/                # Report generation
    system/                # Collaboration, multi-agent, kernel updates
  docs/
    architecture.md        # Deep-dive on context-staging philosophy
    installation.md        # Platform-specific setup instructions
    quick-start.md         # 5-minute setup guide
    skill-authoring.md     # How to write new skills
  hooks/
    credential-guard.sh    # Blocks edits to .env / credential files
    file-backup.sh         # Auto-snapshots before file mutations
    search-year-fix.sh     # Appends current year to web searches
  tools/
    validate-skills.sh     # Validates skill integrity against kernel
  examples/
    user-config/           # Example USER MODEL configurations
    memory/                # Example persistence tier setups
```

---

## Documentation

- [Architecture](docs/architecture.md) -- Context-staging philosophy, token ordering, compression prohibition
- [Installation](docs/installation.md) -- Platform-specific setup for Claude Code and claude.ai
- [Quick Start](docs/quick-start.md) -- 5-minute setup and first conversation
- [Skill Authoring](docs/skill-authoring.md) -- How to write new EOS skills
- [Hooks](hooks/README.md) -- Safety and quality hooks for Claude Code

---

## Hooks

Three Claude Code hooks ship with EOS for filesystem-level safety and search quality:

| Hook | Purpose |
|------|---------|
| `credential-guard.sh` | Blocks Write/Edit on `.env`, credential files, private keys |
| `file-backup.sh` | Creates timestamped backup before any file mutation |
| `search-year-fix.sh` | Appends current year to web searches for fresh results |

See [hooks/README.md](hooks/README.md) for installation instructions.

---

## Known Issues

- **Pieces LTM reference drift.** Pieces MCP supplementary writes can drift from Notion state over long sessions. Notion is authoritative when they conflict. Pieces is a convenience layer, not a source of truth.
- **Context window pressure.** The kernel is approximately 5,400 tokens (trimmed in v20.5.0 -- changelog moved to Notion). The Context Limit Monitor (Rule 9) manages context pressure, but users in extended sessions should monitor the `ltm` counter in the runtime header.
- **Skill module loading.** On claude.ai (non-Code), skill loading depends on the Projects feature placing files in `/mnt/skills/user/`. Verify paths if skills are not triggering.

---

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.
