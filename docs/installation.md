# Installation

Platform-specific setup for EOS v20.1.0.

---

## Claude Code (CLI)

Claude Code reads system instructions from `~/.claude/CLAUDE.md` and skill files from `~/.claude/skills/`.

### 1. Copy the kernel

```bash
cp kernel/CLAUDE.md ~/.claude/CLAUDE.md
```

If you have an existing `CLAUDE.md`, back it up first. EOS expects to be the sole occupant of this file -- it controls token ordering and any content outside the kernel structure will be positioned incorrectly in the attention window.

### 2. Copy skills

```bash
mkdir -p ~/.claude/skills/
cp -r skills/* ~/.claude/skills/
```

This creates the category directories (`lifecycle/`, `build/`, `memory/`, etc.) under `~/.claude/skills/` with all 18 skill files.

### 3. Validate

```bash
bash tools/validate-skills.sh
```

The validation script checks:
- All 18 expected skill files exist at their expected paths.
- Each skill has valid YAML frontmatter with `name`, `version`, and `kernel_compat` fields.
- Skill versions match the `skill_versions` table in the kernel's Runtime Parameters.
- `kernel_compat` values are compatible with the current kernel version.

Fix any reported mismatches before starting a session.

### 4. Populate the USER MODEL (recommended)

The kernel ships with an empty USER MODEL template. EOS works without it, but displacement strength scales directly with USER MODEL specificity. An empty USER MODEL means generation falls back to training priors with rule-filtering only -- the architecture EOS is designed to replace.

Edit `~/.claude/CLAUDE.md` and populate the USER MODEL section:

```
Domain:              [your specific field, years of experience, methodology]
Method:              [how you work -- named frameworks, processes]
Measurement:         [what you optimize for -- specific KPIs, metrics]
Current project:     [name, state, locked variables, goal]
Vocabulary:          [your terms mapped to model defaults]
Validated patterns:  [patterns you have evidence for]
Decision history:    [recent decisions with reasoning basis]
Operating context:   [constraints, tools, environment specifics]
```

Specificity is displacement strength. "Experienced engineer" provides zero displacement. "12 years building distributed systems, constraint-graph methodology, optimizing for p99 latency under 50ms" provides strong displacement.

---

## Claude.ai (Web / Projects)

On claude.ai, system instructions are set via Projects and skill files are placed in the project's file context.

### 1. Create a project

In claude.ai, create a new Project. Paste the contents of `kernel/CLAUDE.md` into the project's system instructions (Custom Instructions field).

### 2. Add skills

Upload skill files to the project. On claude.ai with Projects, uploaded files are accessible at `/mnt/skills/user/`. Maintain the category directory structure:

```
/mnt/skills/user/lifecycle/eos-cold-start.md
/mnt/skills/user/lifecycle/eos-goal-framing.md
/mnt/skills/user/lifecycle/eos-project-mgmt.md
/mnt/skills/user/build/eos-builder.md
/mnt/skills/user/memory/eos-memory-mgmt.md
/mnt/skills/user/memory/eos-memex.md
/mnt/skills/user/memory/eos-recall-router.md
/mnt/skills/user/reasoning/eos-contradiction.md
/mnt/skills/user/reasoning/eos-constraint-graph.md
/mnt/skills/user/reasoning/eos-dimension-ambiguity.md
/mnt/skills/user/quality/eos-metacognition.md
/mnt/skills/user/quality/eos-fact-check.md
/mnt/skills/user/quality/eos-voice-extract.md
/mnt/skills/user/quality/tangent-drift-score.md
/mnt/skills/user/output/eos-report.md
/mnt/skills/user/system/eos-collaboration.md
/mnt/skills/user/system/eos-multi-agent.md
/mnt/skills/user/system/eos-kernel-updater.md
```

### 3. Populate the USER MODEL

Same as the Claude Code instructions above. Edit the USER MODEL section in the project's system instructions with your specific context.

---

## Notion Setup (Tier A Persistence)

Notion is the authoritative persistence store for EOS. It is optional -- EOS functions without it (Tier C: conversation-only state) -- but cross-session memory and drift detection require it.

### Requirements

- A Notion workspace with API access.
- The Notion MCP server connected to your Claude environment.
- Permissions to create pages and databases.

### Structure

EOS uses a Hub-and-Spoke model in Notion:

- **Hub page:** A single index page listing all active projects. Created by `eos-cold-start` on first project initialization.
- **Spoke pages:** One per project. Contains project state: goal, locked variables, constraint graph, decision log, CCI snapshots. Created by `eos-cold-start` when a new project is started.

The `eos-memory-mgmt` skill handles all Notion reads and writes. It detects Notion availability at session start (M1 hard gate) and classifies the persistence tier accordingly.

### Decision-lock events

The kernel defines 14 event types that trigger immediate Notion writes:

- Goal locked / Goal moved
- Variable locked
- Constraint promoted
- I-tagged decision (high-risk)
- Hard limit conflict resolved
- Feasibility thesis locked
- Agreement (bilateral)
- Concession
- CCI-G hits 80%
- Convergence declared
- Context threshold (70%)
- USER MODEL updated

Each write includes event type, active project identifier, and timestamp context.

### Drift detection

At session start, the `eos-memory-mgmt` skill queries Notion for the active project's Spoke page and compares its state against any claims in the current conversation. Discrepancies are flagged before substantive work begins.

---

## Pieces LTM Setup (Tier B Persistence)

Pieces Long-Term Memory is a supplementary persistence layer. It is entirely optional.

### Requirements

- Pieces desktop application installed and running.
- Pieces MCP server connected to your Claude environment.

### Behavior

When available, Pieces receives supplementary writes alongside Notion. It serves as a secondary record and a fast-access cache for cross-session recall.

Important constraints:
- Pieces failure does not degrade CCI.
- When Pieces and Notion conflict, Notion wins.
- Pieces is not authoritative for any state.
- Reference drift can occur over long sessions (see Known Issues in README).

### Without external persistence

If neither Notion nor Pieces is available, EOS operates at Tier C: state persists only in conversation history. The kernel and all rules function normally. Cross-session memory and drift detection are unavailable. Single-source recall is treated as medium confidence.

---

## Validation

After installation, verify the setup:

1. **Run the validation script** (Claude Code only):
   ```bash
   bash tools/validate-skills.sh
   ```

2. **Start a conversation.** The first response should include a runtime header:
   ```
   [lens:4] [sim-d:3] [CCI-G:n/a] [sim:M] [pos:held|basis:init] [tds:off] [ltm:--]
   ```

3. **Check persistence tier.** The `eos-memory-mgmt` skill runs M1 at session start and reports detected tier. If you set up Notion and it reports Tier C, check your MCP connection.

4. **Say "new project."** This triggers `eos-cold-start` and exercises goal-locking, storage detection, and Spoke creation. If it activates and asks for a project name and goal, skills are loading correctly.
