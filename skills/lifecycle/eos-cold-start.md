---
name: eos-cold-start
version: "v1.0.1"
kernel_compat: "v20.4.0"
state: trigger-ready
description: "New project creation and initialization. Triggers whenever the user says 'new project', 'start a project', 'create a project', 'spin up a project', or any equivalent phrasing that indicates they want to begin tracking a new initiative. Also triggers when the user names something that doesn't exist in the Hub and wants to formalize it. Creates Notion Hub entry and Spoke with Core sections. Do NOT trigger for casual mentions of ideas or brainstorming — only when the user signals intent to track and manage."
---

# Module A: Cold-Start (New Project Creation)

**Trigger:** User says "new project" or equivalent.
**Kernel rules in play:** Rule 1 (Goal Lock), Rule 6 (Autonomy Tiers), State Storage (kernel).

---

## Steps

### A1. Storage Detection
Check persistence tier per kernel State Storage and `eos-memory-mgmt` M1:
- Notion MCP available (`notion-fetch`, `notion-search`, etc.) → Tier A.
- Notion unavailable → Tier C (state persists in conversation only).
- Pieces MCP is supplementary — its presence/absence does not change tier classification.

If Tier C, flag: CCI-F takes a hit on persistence. Proceed anyway — kernel functions without external storage.

### A2. Project Extraction
Ask for:
- Project name
- One-line goal

Do not proceed without both. If the user gives a vague goal, push for specificity per Rule 1 — goal must be explicit.

### A3. Collaborator Extraction
Ask who has input or authority on this project. For each collaborator, record:
- Name
- Authority domain (what they can lock variables on)

If user says "just me" — log it and move on. Don't over-extract.

### A4. Initial State Write

**Tier A (Notion available):**
Write to Notion via `notion-create-pages`:
- Create Spoke page with Core sections (see `eos-memory-mgmt` M5)
- Project name, goal statement, collaborators and authority domains
- Status: Initialization complete, goal framing next
- If Pieces available: supplement with `create_pieces_memory`

**Tier C (Notion unavailable):**
State exists in conversation history only. Note that cross-session recall depends on `conversation_search` finding this exchange.

### A5. Optional: Notion/Jira Setup
If the user wants structured project tracking in Notion or Jira, create it. This is an organizational layer — not a persistence dependency. The kernel does not require it.

If created, structure:
- Hub entry: Name, Priority, Status (active), Collaborators
- Spoke page with core sections: Active Goals, Goal Log, Locked Variables, Constraint Registry, Decisions Made, Current Project State

Only create if user asks or project complexity warrants it. Lightweight projects don't need Notion scaffolding.

### A6. Initial Module Activation
- Goal is not locked (just stated, not confirmed through framing).
- CCI-G is undefined.
- Flag: `eos-goal-framing` skill will activate on next goal-related interaction.

---

## Post-Completion

State what was created, where it lives, and what happens next. One line each. No ceremony.
