---
name: eos-recall-router
version: "v1.0.0"
kernel_compat: "v20.1.0"
description: "Intent-routed memory retrieval — classifies recall queries by type and routes to the optimal persistence layer. Replaces ad-hoc retrieval with structured dispatch. Triggers on any memory retrieval need (internal to other skills, explicit user recall, CONTINUE keyword). Pattern: classify → route to primary layer → fallback to secondary → escalate to cross-layer."
---

# EOS Recall Router Skill

## Trigger
- **Any memory retrieval need** — when a skill or the kernel needs to recall prior context.
- **Explicit user recall** — "what did we decide about X", "remind me about Y", "what's the status of Z".
- **CONTINUE [topic]** — session bridge state loading delegates here.
- **Internal delegation** — other skills (eos-memory-mgmt, eos-fact-check, eos-voice-extract) call this for retrieval instead of doing ad-hoc searches.

## Autonomy
- Tier 1: All retrieval is autonomous. No user confirmation needed for reads.

---

## R1: Query Classification

Before searching, classify the query intent. Use pattern matching first — LLM only for ambiguous queries that don't match any pattern.

| Query Type | Pattern Signals | Primary Layer | Fallback Layer |
|---|---|---|---|
| `feedback_recall` | "how should I", "what's the rule for", "you told me to" | Auto-memory (feedback type files) | Notion Spoke DECISIONS MADE |
| `user_context` | "my background", "my role", "who am I" | Auto-memory (user type files) | Notion Spoke USER MODEL |
| `project_state` | "status of", "where are we on", "what's happening with" | Notion Spoke CURRENT PROJECT STATE | Auto-memory (project type files) |
| `decision_lookup` | "what did we decide", "agreed", "the decision was" | Notion Spoke DECISIONS MADE | Auto-memory (feedback/project files) |
| `reference` | "where do we", "where is", "how do I find" | Auto-memory (reference type files) | Notion search |
| `temporal` | "last week", "yesterday", "on Tuesday", date references | Notion (date-filtered search) | Pieces LTM (if available) |
| `entity_lookup` | person names, project names, tool names | Notion search | Pieces persons search (if available) |
| `cross_layer` | Ambiguous, broad, or multi-faceted queries | All layers parallel | — |

## R2: Retrieval Execution

### Step 1: Route to primary layer

Execute the search against the classified primary layer:

- **Auto-memory:** Read the relevant typed files from `~/.claude/projects/*/memory/`. Filter by frontmatter `type` field matching the query classification.
- **Notion Spoke:** Use `notion-search` with query terms. If a specific Spoke section is targeted (e.g., DECISIONS MADE), use `notion-fetch` on the known Spoke page and extract the relevant section.
- **Notion search:** Use `notion-search` for broader queries across the workspace.
- **Pieces LTM:** Use `ask_pieces_ltm` for temporal or entity queries. Graceful skip if Pieces returns empty (current state: no data in Pieces).
- **Obsidian:** Use `obsidian_simple_search` for vault queries. Graceful skip if empty (current state: near-empty vault).

### Step 2: Evaluate result quality

- **Hit:** Primary layer returns relevant, specific content → return with source attribution.
- **Partial:** Primary returns something but it's incomplete or low-confidence → proceed to fallback.
- **Miss:** Primary returns nothing → proceed to fallback.

### Step 3: Fallback layer

If primary missed or returned partial results, search the fallback layer from the classification table.

### Step 4: Cross-layer escalation

If both primary and fallback miss, escalate to parallel search across all available layers:
1. Read all auto-memory files
2. Notion workspace search
3. Pieces LTM query (if available)
4. Obsidian vault search (if available)

Merge results. Deduplicate by content similarity. Return with source attribution for each result.

## R3: Output Format

Return results with source attribution:

```
[RECALL] Query type: {classification}
[SOURCE: {layer}] {result content}
[SOURCE: {layer}] {additional result if multiple hits}
[CONFIDENCE: HIGH/MEDIUM/LOW] — {basis}
```

Confidence rules:
- **HIGH:** Two or more layers agree on the same fact.
- **MEDIUM:** Single-layer hit with specific, detailed content.
- **LOW:** Single-layer hit with vague content, or cross-layer search returned sparse results.

Single-source recall from Pieces or Obsidian (currently empty layers) is automatically LOW confidence regardless of content quality.

## R4: Layer Health Awareness

The router maintains awareness of which layers are actually populated:

- **Notion:** Active, primary store. Always query.
- **Auto-memory:** Active, 8 files. Always query when type matches.
- **Pieces:** Connected but empty. Skip unless user has started populating it. Check via a lightweight `ask_pieces_ltm` — if it returns empty, mark as `dormant` and skip for remainder of session.
- **Obsidian:** Connected, near-empty. Same dormancy check — `obsidian_list_files_in_vault` at session start. If vault is sparse (< 10 content files), mark as `dormant`.

Dormant layers are skipped in primary/fallback routing but still included in cross-layer escalation (in case new content was added).

---

## Cross-References
- Kernel CONTINUE keyword: Uses this skill for state loading instead of direct Notion queries.
- `eos-memory-mgmt` M1.3 (USER MODEL Population): Can delegate to this skill for structured retrieval.
- `eos-fact-check`: Uses this skill to gather facts from all layers for contradiction detection.
- `eos-voice-extract`: Uses this skill to check for duplicate facts before writing new ones.
