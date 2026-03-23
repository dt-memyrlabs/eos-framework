---
name: eos-multi-agent
version: v1.0.0
kernel_compat: "v20.0.0"
trigger: When a task requires parallel execution across multiple independent workstreams, or when the user explicitly requests multi-agent orchestration.
---

# EOS Multi-Agent Skill v1.0.0

## Purpose
Materialize the multi-agent coordination pattern referenced in the EOS kernel (Rule 6 subagent autonomy ceiling, Runtime Parameters module_state).

## Spawn Protocol

### 1. Decomposition
Before spawning agents, decompose the goal into independent subtasks:
- Each subtask must be completable without output from other subtasks
- Dependent subtasks are sequenced, not parallelized
- Maximum 5 concurrent agents (budget protection)

### 2. Agent Specification
Each spawned agent gets:
- **Role**: One-line description of what it does
- **Goal**: Specific, measurable deliverable
- **Scope**: Files/directories it can touch
- **Ceiling**: Tier 1 (full autonomy) or Tier 2 (decision-lock events held for parent confirmation) — default Tier 2
- **Timeout**: Maximum execution time (default 5 minutes)
- **Kill condition**: What triggers early termination

### 3. Coordination Patterns

**Fan-out/Fan-in (default):**
1. Parent decomposes goal → N subtasks
2. Spawn N agents in parallel
3. Collect all results
4. Parent synthesizes into unified output

**Pipeline:**
1. Agent A produces output
2. Output feeds as input to Agent B
3. Sequential, each stage transforms

**Competitive:**
1. Spawn N agents with same goal, different approaches
2. Collect all results
3. Parent evaluates and selects best

### 4. Autonomy Ceiling (from kernel Rule 6)
- Subagents default to **Tier 2** — they can act, but decision-lock events are held pending parent confirmation
- Explicit override to **Tier 1** allowed per-spawn for trusted, low-risk tasks (e.g., read-only research)
- Tier 3 tasks are never delegated to subagents — parent handles directly

### 5. Kill Switch
Any agent can be terminated by:
- Timeout expiry
- Parent detecting off-track output
- Budget cap reached (token/cost limit)
- User interrupt

Kill is immediate. Partial output is collected and flagged as incomplete.

### 6. Budget Protection
- Default per-agent budget: $0.50
- Default total orchestration budget: $5.00
- Override via `--budget` flag
- Budget exceeded = hard stop, no retry without user confirmation

## Implementation Paths

### Bash (multi-agent.sh)
- Uses `claude -p` with background processes
- PID tracking for kill switch
- Temp files for inter-agent communication
- Best for: Unix environments, simple fan-out

### Node.js (multi-agent.js)
- Uses `child_process.spawn`
- Event-driven coordination
- Structured JSON communication
- Best for: Windows, complex orchestration, timeout handling

### Claude Code Native
- Uses Agent tool with `run_in_background`
- Built-in context isolation
- Best for: Interactive sessions within Claude Code

## Error Handling
- Agent crash: Log error, continue with remaining agents, synthesize from partial results
- All agents fail: Report failure modes, suggest decomposition changes
- Timeout: Collect partial output, flag incomplete, proceed with synthesis

## State Reporting
Each orchestration reports:
```
[SWARM] Goal: <goal>
[SWARM] Agents: <N> spawned, <M> complete, <K> failed
[SWARM] Budget: $X.XX / $Y.YY used
[SWARM] Status: <running|complete|partial|failed>
```
