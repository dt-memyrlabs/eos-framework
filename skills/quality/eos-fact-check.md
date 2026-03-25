---
name: eos-fact-check
version: "v1.0.0"
kernel_compat: "v20.4.0"
state: trigger-ready
description: "Contradiction resolution across memory layers — audits auto-memory, Notion, Pieces, and Obsidian for conflicting, stale, or orphaned facts. Triggers on manual invoke or when eos-memory-mgmt detects staleness (ltm >= 5). Uses eos-recall-router for structured retrieval. Presents findings for user approval before executing resolutions."
---

# EOS Fact Check Skill

## Trigger
- **Manual invoke:** User says "fact check", "audit memory", "check for contradictions", or `/fact-check`.
- **Auto-trigger:** When `eos-memory-mgmt` detects ltm staleness >= 5 exchanges since last Notion write.
- **Session start (optional):** Can be invoked as part of drift detection if discrepancies are suspected.

## Autonomy
- Tier 1: Reading and comparing facts across layers (autonomous).
- Tier 2: Reporting findings (notify user).
- Tier 3: Executing resolutions (require confirmation for any write/delete/update).

---

## F1: Gather All Facts

### Step 1: Read auto-memory

Read all files in the auto-memory directory (`~/.claude/projects/*/memory/`). For each file, extract:
- File name
- Frontmatter: name, description, type
- Body content (the actual fact/rule/reference)

### Step 2: Query Notion

Use `eos-recall-router` with query type `cross_layer` to pull:
- Active project Spoke pages (LOCKED VARIABLES, DECISIONS MADE, CONSTRAINT REGISTRY, USER MODEL sections)
- Hub database entries for active projects

### Step 3: Query secondary layers

- **Pieces:** `ask_pieces_ltm` with "What are the current active rules, decisions, and project states?" — graceful skip if empty.
- **Obsidian:** `obsidian_simple_search` for key terms from auto-memory facts — graceful skip if vault is sparse.

## F2: Compare and Detect

For each fact in auto-memory, run three checks:

### Check 1: Contradictions

Compare each auto-memory fact against Notion content by subject/topic:

- **Same subject, different claim:** Auto-memory says "Sales short tenure = failure" but Notion Spoke says "Sales short tenure acceptable if artifacts exist" → **CONTRADICTION**.
- **Detection method:** Extract the subject (what the fact is about) and the claim (what it asserts). Search other layers for facts with the same subject. If claims conflict, flag.

### Check 2: Staleness

For each fact, evaluate whether it references states that may have changed:

- **Date references:** Facts mentioning specific dates or timeframes that have passed → flag for review.
- **Project references:** Facts about projects — check if the project state in Notion has moved past what the fact assumes.
- **People/role references:** Facts about people's roles or relationships — check against current Notion state.
- **Version references:** Facts referencing specific EOS versions or skill versions — check against current kernel.

### Check 3: Orphaned facts

Facts that exist in one layer with no supporting evidence in any other layer:

- Auto-memory fact with no corresponding Notion entry → not necessarily orphaned (auto-memory is lightweight by design), but flag if the fact references a decision or agreement that should have been recorded in Notion.
- Notion entry with no corresponding auto-memory reference → normal (Notion is more detailed). Only flag if the Notion entry is a directive or preference that should be in auto-memory for session-level access.

## F3: Report Findings

Present findings grouped by severity:

```
## Fact Check Report

### CONTRADICTIONS (resolve immediately)
1. [auto-memory: feedback_X.md] says: "{claim A}"
   [Notion: Spoke/Project Y] says: "{claim B}"
   Subject: {what this is about}
   Recommendation: {which to keep and why}

### STALE (review and update)
1. [auto-memory: project_X.md] references: "{stale state}"
   Current state: "{what Notion shows now}"
   Recommendation: update / delete / keep with caveat

### ORPHANED (informational)
1. [auto-memory: feedback_X.md] — no Notion backing
   Risk: {low/medium — does this need Notion backing?}
```

If no issues found: `Fact check clean. {N} facts across {M} layers, no contradictions or staleness detected.`

## F4: Execute Resolutions

After user reviews findings and approves resolutions:

| Resolution | Action |
|---|---|
| `invalidate` | Update auto-memory file: add `**SUPERSEDED by:** {new fact source}` to body. Or delete if user prefers clean removal. |
| `merge` | Rewrite auto-memory file with merged content from both sources. Update frontmatter description. |
| `delete` | Remove auto-memory file. Update MEMORY.md index. |
| `update` | Edit auto-memory file with corrected content. |
| `flag_notion` | Add a note to the relevant Notion page flagging the discrepancy for manual review. |

After resolutions: update MEMORY.md index if any files were added/removed/renamed.

---

## Cross-References
- `eos-recall-router`: Used for structured retrieval in F1.
- `eos-memory-mgmt` M4 (Writeback Policy): Staleness counter (ltm >= 5) triggers this skill.
- Kernel Rule 5 (Regression Lock): Contradictions on locked variables are highest severity — locked variable regression.
- Kernel Rule 4 (Contradiction Integrity): This skill extends contradiction detection to the persistence layer.
- Auto-memory system: This skill is the maintenance layer for the auto-memory files.
