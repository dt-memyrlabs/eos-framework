---
name: eos-multi-agent
version: "v1.1.0"
kernel_compat: "v20.2.0"
state: trigger-ready
trigger: When a task requires parallel execution across multiple independent workstreams, or when the user explicitly requests multi-agent orchestration.
description: >
  Multi-agent kernel propagation — spawning EOS-aware subagents with compressed
  kernel bundles, structured state synchronization, and conflict resolution.
  Triggers when the user requests parallel exploration, when multiple trajectories
  need deep concurrent investigation, or on explicit request ('spawn agent',
  'parallel explore', 'multi-agent'). Requires a locked goal. Subagents default
  to Tier 2 autonomy ceiling unless explicitly overridden. Do NOT trigger for
  simple subagent tasks that don't need EOS awareness — only when the subagent
  must operate under goal lock, constraint graph, or trajectory context.
---

# EOS Multi-Agent Skill v1.1.0

## Purpose
Parallel agent orchestration with structured lifecycle. Five phases: pre-flight, recon, decomposition, deployment, consolidation.

**Kernel rules in play:** Rule 6 (Autonomy Tiers, subagent ceiling), Rule 2 (Generation Frame), Rule 4 (Contradiction — cross-agent), Rule 5 (Regression Lock).

---

## Phase 0: PRE-FLIGHT

Before anything spawns, validate readiness.

**Checklist:**
1. Goal is locked (Rule 1). No goal lock = no swarm.
2. Tools available for planned spawns — verify via tool search.
3. Budget check: $5.00 total ceiling unless user overrides.
4. Coordination pattern selected:
   - **Fan-out/Fan-in** (default): Independent subtasks, parallel execution, unified synthesis.
   - **Pipeline**: Sequential stages, each transforms output of previous.
   - **Competitive**: Same goal, different approaches, parent selects best.

**Pre-flight failure = full stop.** No partial launches.

---

## Phase 1: RECON

Lightweight scan of the actual input space before any agent spawns. Agents should receive pre-filtered, scoped input — not "go figure it out."

**Protocol:**
1. Scan the input space using read-only tools (Glob, Grep, Read).
2. Map what exists: files, modules, data sources, scope boundaries.
3. Group inputs into **squads** by concern or dependency.
4. Each squad = one agent's input set.

**Constraints:**
- Time budget: <30 seconds. If recon exceeds this, the decomposition is too broad — split the goal first.
- Read-only only. No writes, no mutations during recon.
- Output: Scoped input map documenting what each squad covers and why.

**Squad formation rules:**
- Group by concern (not by file count).
- Each squad should be independently analyzable.
- Overlapping files across squads = flag for dependency (may need Pipeline, not Fan-out).
- If >5 squads form, the goal is too broad — decompose the goal into sub-goals first.

---

## Phase 2: DECOMPOSITION

Break the goal into subtasks using recon output. Each subtask gets a specific input set from Phase 1.

### Agent Specification (mandatory — all fields required)

```yaml
agent:
  role: [one-line specialist description]
  goal: [specific, measurable deliverable]
  scope: [file set from Phase 1 recon — explicit paths]
  tools:
    - [Tool1]
    - [Tool2]
    - [Tool3]
  ceiling: Tier 2          # default. Tier 1 for trusted read-only tasks.
  kill: [condition]         # timeout, off-track, budget
  budget: $0.50             # per-agent default
```

### Tool Manifest Rules (STRUCTURAL — not advisory)

| Condition | Action |
|---|---|
| No explicit tool list | **Orchestration violation.** Spawn rejected. |
| Tool list ≤ 5 items | Proceed. |
| Tool list 6-8 items | Warning flag. Justify in decomposition notes. |
| Tool list > 8 items | **Hard block.** Redesign the agent scope — it's too broad. |

**Decomposition quality checks:**
- Each subtask must be completable without output from other subtasks (Fan-out) or must be explicitly sequenced (Pipeline).
- Dependent subtasks are never parallelized.
- Every file from Phase 1 recon must appear in exactly one agent's scope. Gaps = uncovered input space. Overlaps = dependency risk.

---

## Phase 3: DEPLOY

Spawn agents in parallel. Maximum 5 concurrent.

### Spawn Template

```
Agent: [role]
Goal: [deliverable]
Scope: [file paths from recon]
Tools: [explicit list]
Ceiling: Tier [1|2]

[Compressed context from recon findings relevant to this agent's scope]
```

### During Deployment
- **[SWARM] status reporting** on each agent completion:
  ```
  [SWARM] Goal: <goal>
  [SWARM] Agents: <N> spawned | <M> complete | <K> failed
  [SWARM] Budget: $X.XX / $Y.YY used
  [SWARM] Status: <running|complete|partial|failed>
  ```
- Agent crash: Log error, continue with remaining agents.
- Timeout: Collect partial output, flag as incomplete.
- All agents fail: Report failure modes, suggest decomposition changes. Do not retry without user input.

### Autonomy Ceiling (from kernel Rule 6)
- Default: **Tier 2** — agents act, but decision-lock events are held pending parent confirmation.
- Override to **Tier 1** allowed per-spawn for trusted, low-risk tasks (e.g., read-only research).
- **Tier 3 tasks are never delegated** — parent handles directly.

---

## Phase 4: CONSOLIDATE

Collect results from all agents. Produce a unified output. This is not optional — parallel outputs without consolidation are not a deliverable.

### Consolidation Protocol

1. **Collect**: Gather all agent outputs (complete and partial).
2. **Cross-reference**: Compare findings across agents.
   - Agreements: Multiple agents reached the same conclusion → high confidence.
   - Contradictions: Agent X says A, Agent Y says B → escalate per Rule 4.
3. **Gap analysis**: Compare agent scopes against Phase 1 recon map. Flag uncovered input space.
4. **Synthesize**: Produce unified output that integrates all agent findings.

### Consolidation Report Template

```
CONSOLIDATION REPORT
====================
Goal: [original goal]
Agents: [X spawned / Y complete / Z failed]
Coverage: [% of recon input space covered by successful agents]

FINDINGS (per agent):
- [Agent role]: [key finding] | confidence: H/M/L

CROSS-REFERENCES:
- [Agreement]: Agents [X] and [Y] both found [Z]
- [Contradiction]: Agent [X] says [A], Agent [Y] says [B] → [resolution or escalation]

GAPS:
- [Uncovered input space from recon, if any]
- [Incomplete agent outputs, if any]

SYNTHESIS:
[Unified conclusion integrating all agent results]
[Confidence: H/M/L based on agreement rate, coverage, and contradiction count]
```

### Post-Consolidation
- If contradictions remain unresolved → present to user for moderation (Rule 4).
- If coverage < 80% → flag and recommend re-run with adjusted decomposition.
- If all agents failed → no synthesis attempt. Report failure modes only.

---

## Budget Protection

| Parameter | Default | Override |
|---|---|---|
| Per-agent budget | $0.50 | Per-spawn specification |
| Total orchestration budget | $5.00 | `--budget` flag or user instruction |
| Maximum concurrent agents | 5 | Not overridable (system constraint) |

Budget exceeded = hard stop, no retry without user confirmation.

---

## Implementation Paths

### Claude Code Native (preferred)
- Uses Agent tool with `run_in_background` for parallel spawns.
- Built-in context isolation per agent.
- TaskOutput for result collection.
- Best for: Interactive sessions, most orchestration patterns.

### Bash (multi-agent.sh)
- Uses `claude -p` with background processes.
- PID tracking for kill switch.
- Temp files for inter-agent communication.
- Best for: Automated pipelines, CI/CD integration.

### Node.js (multi-agent.js)
- Uses `child_process.spawn`.
- Event-driven coordination.
- Structured JSON communication.
- Best for: Complex orchestration with programmatic control.
