---
name: eos-memex
version: "v1.1.1"
kernel_compat: "v20.2.0"
state: trigger-ready
description: >
  Indexed experience memory for long-horizon EOS sessions. Implements the Memex
  pattern: compact in-context indexed summary + full-fidelity external archive.
  Trigger when: (1) ltm staleness ≥ 5, (2) Rule 9 context pressure fires,
  (3) user says MEMEX COMPRESS or MEMEX READ [index], (4) a subgoal requires
  evidence from earlier in the session that has been displaced by growth,
  (5) any response where you would otherwise repeat or re-derive content
  already produced. Also trigger when starting a new project session to
  initialize the indexed summary structure. Do NOT trigger on short sessions
  with no accumulated evidence.
---

# EOS Memex — Indexed Experience Memory

## What This Skill Does

Applies the Memex architecture to EOS sessions:

- **Working context** stays compact: indexed summary only (goal state + index map).
- **External archive** (Notion Tier A, or conversation_search Tier C) holds full-fidelity evidence blocks under stable semantic indices.
- **CompressExperience**: writes content blocks to archive, replaces in-context with index entry.
- **ReadExperience(index)**: agent-decided dereference — pulls exact archived content back into context when current subgoal needs it.

This is not summarization. Evidence is not paraphrased or discarded — it is archived intact and retrieved verbatim on demand.

---

## Primitives

### Indexed Summary (in-context state)

Maintain this block in working context. Update on every compress operation.

```
## MEMEX STATE
goal: [locked goal statement]
cci_g: X%
active_threads: [list]
last_decision: [brief]

## INDEX MAP
| index           | description                                      | tier | written    |
|-----------------|--------------------------------------------------|------|------------|
| [semantic_name] | [one-line: what it is + why it would be needed]  | A/C  | [exchange] |
```

The index map is the only representation of compressed content that stays in working context. It is not a summary of the content — it is a retrieval cue pointing to the full artifact.

---

### Index Naming Convention

Indices are stable, semantic, human-readable keys. Format: `[project]-[artifact_type]-[specificity]`

Examples:
- `bbm-sms-flow-zapier-config`
- `al6063-supplier-quote-march`
- `gift8-db-schema-v2`
- `eos-rule2-amendment-draft`

Rules:
- No timestamps in the key (timestamps go in the description field).
- No generic names (`output-1`, `result`, `notes`). Every index must be self-describing.
- Collision: append `-b`, `-c` etc. Never overwrite an existing index.

---

## COMPRESS — When and How

### Trigger conditions (any one sufficient)

1. `ltm` staleness counter ≥ 5 (Rule 9 integration)
2. Rule 9 context pressure fires (70% or 90%)
3. Current reasoning relies on content produced ≥ 8 exchanges ago
4. User issues `MEMEX COMPRESS`
5. A new subgoal starts and prior subgoal's full output is no longer actively needed

### What to compress

Compress content that is:
- Full-fidelity and large (tool outputs, code blocks, schema definitions, quotes, API responses)
- Referenced by later reasoning but not needed verbatim right now
- Produced in a completed subgoal

Do NOT compress:
- The goal statement (always in-context)
- Active locked variables (always in-context)
- The current simulation disclosure
- The indexed summary itself

### Compression procedure

1. **Identify candidates** — scan working context for compressible blocks.
2. **Write to archive — dual-write (Notion + Obsidian):**
   - Assign a stable index name (convention above)
   - **Notion (primary):** create/update section in project Spoke under `## MEMEX ARCHIVE` → subsection per index. Use Notion MCP tools.
   - **Obsidian (secondary):** append/patch into `EOS/memex-index.md` in vault under `## [index-name]` heading. Use Obsidian MCP tools (`patch_content` or `append_content`).
   - Both writes attempted every time. If one fails, log inline and continue — other store still has the content.
   - If both unavailable → Tier C: log index + content in conversation, use `conversation_search` for later retrieval.
3. **Update index map** — add row to MEMEX STATE with index name, description, tier (`A-dual` / `A-notion` / `A-obsidian` / `C`), exchange number.
4. **Replace in-context** — remove full content block. Index map entry is its only in-context representation.
5. **Declare in runtime header** — `[memex:compressed N blocks]`.

### Dual-mode content archival

Two modes for writing to archive (mirrors Memex paper):

**Mode A — Verbatim extraction**: For content that must be exact (code, schema, IDs, API responses, tool outputs). Archive character-for-character. No paraphrase.

**Mode B — Authored**: For content where reorganization adds value (e.g., distilling findings from a long exploration). Write a structured version of the content that preserves all decision-relevant facts.

Always state which mode was used in the index map description field: `[verbatim]` or `[authored]`.

---

## READ — When and How

### Trigger conditions

Dereference when:
1. Current subgoal requires evidence that is in the index map but not in working context
2. User references past work by name and the content is archived
3. Simulation identifies a gap where archived evidence would change the output
4. User issues `MEMEX READ [index]`

Do NOT dereference preemptively. Only pull what the current step causally requires.

### Dereference procedure

1. **Identify target index** from index map. Check tier column.
2. **Fetch content by tier:**
   - `A-dual`: try Notion first → if fails, try Obsidian `EOS/memex-index.md` → `## [index-name]`
   - `A-notion`: Notion only
   - `A-obsidian`: Obsidian `EOS/memex-index.md` only
   - `C`: `conversation_search` with index name; single-source = MEDIUM confidence until cross-validated
3. **Inject into working context** — append as labeled block:
   ```
   [MEMEX READ: index-name | source: notion|obsidian|conversation]
   [content verbatim]
   [/MEMEX READ]
   ```
4. **Declare in runtime header** — `[memex:read index-name]`
5. **Re-compress after use** — if subgoal completes, re-compress the dereferenced block. Do not let them accumulate.

---

## Integration with EOS Rules

### Rule 9 (Context Limit Monitor)

At 70% context: compress before the mandatory Notion state dump. The state dump itself becomes an indexed archive entry (`[project]-context-dump-70pct`). This keeps the dump out of working context while preserving it for `CONTINUE`.

At 90% context: compress all non-essential content before closing threads.

### LTM Staleness Counter

When `ltm` ≥ 5: compress is mandatory before the next decision-lock event. The compress operation counts as a write event and resets `ltm` to 0.

### Rule 1 (Goal Lock)

Goal statement is never compressed. Always in working context.

### Rule 5 (Regression Lock)

Locked variables are never compressed. Always in working context.

### CONTINUE [topic] (Session Bridge)

On `CONTINUE`, after loading project Spoke from Notion, also load `## MEMEX ARCHIVE` section and reconstruct the index map into MEMEX STATE. Cross-reference against `EOS/memex-index.md` in Obsidian — if both available, Notion wins on conflict. This restores full session continuity including all archived evidence.

---

## Tier C Degraded Mode

When Notion is unavailable:

- Indices are logged in conversation only.
- `conversation_search` is the retrieval mechanism.
- Single-source retrieval = MEDIUM confidence until cross-validated.
- CCI-F takes the persistence hit per Rule 3.
- Index map is maintained in-context normally; it just points to conversation history rather than Notion.
- Flag all Tier C entries in the index map with `C*` in the tier column.

---

## MEMEX STATE — Initialization

On first trigger for a session with an active goal, initialize MEMEX STATE:

```
## MEMEX STATE
goal: [load from Rule 1 locked goal]
cci_g: [current value]
active_threads: [list from current session]
last_decision: [most recent I-tagged or bilateral decision]

## INDEX MAP
| index | description | tier | written |
|-------|-------------|------|---------|
| (empty) | | | |
```

Append this block to working context. It persists until session end.

---

## Runtime Header Extensions

When this skill is active, extend the runtime header:

```
[lens:4] [CCI-G:X%] [sim:H] [pos:held|—] [tds:on] [ltm:X] [memex:active|N indexed]
```

`N indexed` = number of entries in current index map.

On compress: `[memex:compressed N→M]` (N blocks compressed, M total indexed)
On read: `[memex:read index_name]`

---

## Failure Modes

| Failure | Detection | Response |
|---|---|---|
| Index collision | Duplicate name in map | Append `-b`, log as assumption violation |
| Tier C retrieval miss | `conversation_search` returns no match | Flag MEDIUM confidence, attempt broader query, declare gap |
| Compress without write confirmation | Notion MCP call fails silently | Verify write before removing from context. If write fails, keep in context and flag |
| Deferred dereference creep | Dereferenced blocks not re-compressed | Re-compress at subgoal boundary, not session end |
| Over-compression | Compressing active variables | Rule 5 check before every compress operation |

---

## Quick Reference

```
MEMEX COMPRESS          → compress compressible blocks in current working context
MEMEX READ [index]      → dereference index, inject content
MEMEX STATUS            → show current MEMEX STATE + index map
MEMEX LIST              → list all indexed entries with descriptions
```
