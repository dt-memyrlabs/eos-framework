---
name: eos-memory-mgmt
version: "v1.2.0"
kernel_compat: "v20.0.0"
description: "Memory hierarchy management — Notion as primary persistence, Pieces as supplementary ambient capture, writeback policy, Spoke/Hub structure. Triggers on session start (persistence detection — HARD GATE), project load, any critical state change (goal shifts, I-tagged decisions, new locked variables, agreements, concessions). Also triggers when reading or writing to Notion Spokes, loading project state, or managing session continuity."
---

# EOS Memory Management Skill

## Trigger
- **Session start:** Persistence detection AND USER MODEL population run immediately. **HARD GATE — no substantive output until persistence tier is established and USER MODEL is populated.**
- **Project load:** When user mentions a project or deeper state is needed.
- **Any critical state change:** Goal shifts, I-tagged decisions, new locked variables, agreements, concessions, USER MODEL updates → immediate Notion write.

## Autonomy
- Tier 1: Persistence detection, USER MODEL population, routine state reads, batched writes.
- Tier 2: State writes that modify Spoke content (notify at next checkpoint).

---

## M1: Persistence Detection (HARD GATE)

**This section runs on the first response of every session. No substantive output is produced until persistence tier is established.** Same enforcement class as the runtime header — a response without completed persistence detection is structurally invalid.

### M1.1: Load Deferred Tools

In claude.ai, MCP tools (Notion, Pieces) are **deferred** — they do not appear in the tool inventory until explicitly loaded via `tool_search`. This is the root cause of persistence failures: checking inventory before loading returns empty, which falsely classifies the session as Tier C.

**Mandatory first action of every session:**

1. Call `tool_search("notion")` to load Notion MCP tools.
2. Call `tool_search("pieces")` to check for Pieces MCP tools.

Do NOT rely on passive tool inventory inspection. Deferred tools must be explicitly loaded before detection can proceed.

### M1.2: Tier Classification

After M1.1 completes:

**Tier A — Notion available:** If Notion tools loaded successfully (`notion-fetch`, `notion-search`, `notion-create-pages`, `notion-update-page`, etc.) → **Tier A**. Notion persistence is operational. If `tool_search` returns no Notion tools → flag `⚠️ NOTION UNAVAILABLE — primary persistence offline. CCI-F degraded.`

**Tier C — Notion unavailable:** If `tool_search` returns no Notion tools → Tier C. Decision-lock events are not written to external storage. State persists only in conversation history.

**Pieces MCP:** If Pieces tools loaded (`ask_pieces_ltm`, `create_pieces_memory`) → supplementary ambient capture is operational. If absent → no impact on CCI-F or tier classification. Pieces is supplementary — its absence does not degrade framework operation.

**Claude native tools:** `conversation_search` and `recent_chats` are always available as baseline recall. Single-source recall from these tools is **MEDIUM confidence** until cross-validated by a second search hit, a Notion Spoke, or user confirmation. Single-source recall cannot promote a variable to locked status alone.

### M1.3: USER MODEL Population

**After tier classification, populate the USER MODEL section (kernel position 1).** This is the primary displacement mechanism — the richer and more specific the USER MODEL, the stronger the prior displacement.

**Population sources by tier:**
- **Tier A:** Query Notion Spoke for: domain, method, measurement, current project state, vocabulary, validated patterns, decision history, operating context. Supplement with Pieces LTM (`ask_pieces_ltm`) for ambient context.
- **Tier C:** Use `conversation_search` and `recent_chats` for whatever is recoverable. USER MODEL will be sparse — CCI-G reflects this.

**Population rules:**
- Specificity is displacement strength. "User is experienced" = zero displacement. Populate with actual data from persistence layer.
- If insufficient data exists, section stays sparse. Do not invent entries.
- Flag sparse USER MODEL: `⚠️ USER MODEL SPARSE — prior displacement weak. Gather context before non-trivial deliverables.`
- Update USER MODEL on every decision-lock event that changes user context (new domain info, validated patterns, vocabulary).

### M1.4: Report

Persistence status is reported in the runtime header via `[ltm:X|—]` (exchanges since last write). CCI-F is checked at session start only (not per-response).

**Tier summary in first response (mandatory):**
- `Tier A: Notion operational` or `Tier C: Notion unavailable — session state at risk`
- If Pieces available: `+ Pieces supplementary`
- USER MODEL status: `populated` / `sparse` / `empty`
- If Tier C: every subsequent response includes `⚠️ TIER C — no external persistence. State dies with this session.`

## M2: Notion — Primary Persistence

Notion is the authoritative store for all structured project information. Every decision-lock event writes to Notion immediately.

**Decision-lock events that trigger Notion writes:**

| Event | Source Rule | Write Content |
|---|---|---|
| Goal locked | Rule 1 | Goal statement, constraints, initial thesis if available |
| Goal moved | Rule 1 | Before/after state, reason for move, user confirmation |
| Variable locked | Rule 5 | Variable name, locked value, basis for lock |
| Constraint promoted | Rule 2 | Constraint, old classification, new classification, evidence |
| I-tagged decision (high-risk) | Rule 6 | Decision, alternatives considered, rationale, risk assessment |
| Hard limit conflict resolved | Rule 7 | Conflict description, resolution path, user acknowledgment |
| Feasibility thesis locked | Rule 2 | Full thesis with priority-ordered dimensions |
| Agreement (bilateral) | Rule 4 | What was agreed, both positions before agreement, basis for convergence |
| Concession | Rule 4 | Who conceded, what moved, what argument caused the move, before/after position |
| CCI-G hits 80% | Rule 3 | Current state snapshot, remaining blockers, convergence distance |
| Convergence declared | Rule 3 | Final state, outcome, lessons if applicable |
| Context threshold (70%) | Rule 9 | Full project state: active goal, locked variables, open threads, CCI-G, assumption log, last decision, open blockers |
| USER MODEL updated | Rule 7 | Updated USER MODEL fields with change reason |

Each write includes: event type, active project identifier, timestamp context.

**Write destination:** The active project's Spoke page under the EOS state page in Notion. If no Spoke exists, create one via cold-start skill. Agreements and concessions append to the `DECISIONS MADE` section with explicit `AGREED` or `CONCEDED` tags for traceability.

**Changelog writes:** Every agreement or concession that modifies the kernel or a skill module also appends to the EOS Changelog page with: version (if version bump), date, what changed, what was agreed/conceded, and the argument that caused the move.

## M3: Pieces — Supplementary Persistence (Tier B)

Pieces is a cross-environment persistence layer operating at the OS level — conversations, browser, IDE, Slack, terminal — regardless of which Claude interface is active (claude.ai, Claude Desktop, Claude Code). This makes it the only store that maintains continuity across environments without separate MCP connections.

**EOS uses Pieces for both read and write:**

**Read operations:**
- `ask_pieces_ltm` for drift detection at session start (supplementary check against Notion Spoke)
- `ask_pieces_ltm` for cross-session context recovery when Notion data is insufficient

**Write operations:**
- `create_pieces_memory` on every decision-lock event that writes to Notion (M4). Pieces write is the Tier B supplement — it fires alongside the Notion write, not instead of it.
- Write content mirrors the Notion write: event type, project identifier, state change, reasoning basis.
- Pieces writes are fire-and-forget. If `create_pieces_memory` fails, log the failure but do not retry or block. Notion is the authority.

**Conflict resolution:** If Pieces and Notion conflict on the same fact, Notion wins.

**Pieces failure does not degrade CCI-F.** Pieces is supplementary — its absence does not block any EOS operation.

## M4: Writeback Policy

- **Critical state changes** (goal shifts, I-tagged decisions, new locked variables, agreements, concessions) → write to the Notion Spoke **immediately** upon confirmation, then fire `create_pieces_memory` as Tier B supplement. No batching. This ensures no loss even if the session ends abruptly.
- **Routine state changes** (assumption updates, thread progress, R-tagged decisions) → batched and written at session end if possible.
- **Accepted tradeoff:** If the session terminates unexpectedly, routine changes may be lost. This is a design decision, not a gap. Critical state is protected by immediate writes. Routine state accepts the risk. Do not over-prioritize writes to avoid this loss.

Gather minimum viable context from available memory layers, then let simulation run. Don't wait for perfect information. Stalling to gather more context when enough exists to simulate is a violation.

## M5: State Storage Structure

### Spoke — Core Sections (always present, created by cold-start skill):
- `ACTIVE GOALS` — project/thread: one-line goal
- `GOAL LOG` — date: old → new | reason (append-only)
- `LOCKED VARIABLES` — variable: value | locked date
- `CONSTRAINT REGISTRY` — constraint: classification (Hard/Structural/Assumed) | source | date
- `DECISIONS MADE` — decision | R/I/AGREED/CONCEDED | rationale (I: + failure modes, rollback; AGREED: both positions + convergence basis; CONCEDED: who moved + what argument caused it)
- `CURRENT PROJECT STATE` — project: phase | last action | next action
- `USER MODEL` — domain, method, measurement, current project, vocabulary, validated patterns, decision history, operating context
- `HANDOFF FLAGS` — what to load before proceeding

### Spoke — Extended Sections (added by project-mgmt skill C0):
- `ASSUMPTION LOG` — assumption | source | status (open/validated/invalidated) | falsification criterion | date
- `OPEN THREADS` — thread: last state | what's needed
- `PROJECT EXTERNAL BLOCKERS` — blocker | affected | owner | status | date
- `LIMITER ANALYSIS LOG` — date: CCI-G% | limiters | challenged | dissolved | rejected | suppressed
- `OUTCOME LOG` — date: decision | predicted | actual | calibration
- `FRAMEWORK FLAGS (Claude-side)` — date: violation | root cause | resolved
- `FRAMEWORK FLAGS (User-side)` — date: pattern | description | DT response | resolved

### Hub Database (00_MASTER_HUB):
Name, Priority, Status, Global Blockers, Collaborators, Autonomy Overrides.

### Version Pages:
Every kernel version gets its own page under the project's Notion space. Versions are never overwritten — only appended.

---

## Cross-References
- Kernel Rule 1 (Goal Lock): Goal shifts trigger M4 immediate write.
- Kernel Rule 2 (Generation Frame): Constraint promotions trigger M4 immediate write.
- Kernel Rule 3 (CCI): CCI-F checked at session start only (not per-response). Notion persistence status.
- Kernel Rule 4 (Contradiction/Position Integrity): Agreements and concessions trigger M4 immediate write + changelog append.
- Kernel Rule 5 (Regression Lock): Variable locks trigger M4 immediate write.
- Kernel Rule 6 (Autonomy Tiers): Governs write permissions.
- Kernel Rule 9 (Context Limit): 70% threshold triggers full state dump to Notion.
- `eos-cold-start` skill: Creates Spoke with Core sections (M5).
- `eos-project-mgmt` skill: C0 adds Extended sections to Spoke (M5).
