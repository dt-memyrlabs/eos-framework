---
name: eos-voice-extract
version: "v1.0.0"
kernel_compat: "v20.4.0"
state: trigger-ready
description: "Session voice fact extraction — scans conversation for uncaptured directives, preferences, habits, beliefs, and goals. Classifies using CORE-derived taxonomy. Cross-checks against existing auto-memory to skip duplicates. Presents extracted facts for user approval before writing. Triggers at session end, on CONTINUE keyword, or manual invoke."
---

# EOS Voice Extract Skill

## Trigger
- **Session end:** User says "done", "wrap up", "that's it", or signals session close.
- **CONTINUE [topic]:** Review last session for uncaptured voice facts before continuing.
- **Manual invoke:** User says "extract voice", "what did I say", "capture preferences", or `/voice-extract`.

## Autonomy
- Tier 1: Scanning conversation and classifying facts (autonomous).
- Tier 3: Writing any fact to auto-memory (require confirmation — every extracted fact needs user approval).

---

## V1: Scan Conversation

Review the current conversation history for statements that reveal the user's operating rules, preferences, habits, beliefs, or goals. These are voice facts — they describe how the user works, thinks, or wants things done.

**What to look for:**

| Fact Type | Signal Patterns | Examples |
|---|---|---|
| **Directive** | "always", "never", "make sure", "don't", "when X do Y", corrections of your behavior | "Don't mock the database in tests" |
| **Preference** | "I prefer", "I like", "use X not Y", style choices, tool choices | "Keep responses under 10 lines" |
| **Habit** | "I usually", "every morning I", "my workflow is", recurring patterns | "I review PRs before standup" |
| **Belief** | "I think", "in my experience", values, opinions that shape decisions | "Small teams ship faster than large ones" |
| **Goal** | "I want to", "by next month", "the target is", future states | "Ship VpTops by end of March" |

**What to ignore:**
- Ephemeral task instructions ("read this file", "fix this bug") — these are session-specific, not persistent.
- Questions or exploration — the user asking about options isn't a preference until they choose.
- Facts already captured in auto-memory — dedup against existing files.
- Facts that belong in Notion project state (locked variables, decisions) — those are handled by `eos-memory-mgmt`.

## V2: Classify and Deduplicate

### Step 1: Classify each extracted fact

Assign one of: `Directive`, `Preference`, `Habit`, `Belief`, `Goal`.

Map to auto-memory type:
- Directive → `feedback` (these are behavioral rules)
- Preference → `feedback` or `user` (depending on whether it's about my behavior or about the user)
- Habit → `user` (describes how the user works)
- Belief → `user` (describes the user's mental model)
- Goal → `project` (describes an active target)

### Step 2: Deduplicate against existing auto-memory

Use `eos-recall-router` with query type `feedback_recall` and `user_context` to retrieve existing auto-memory facts. For each extracted fact:

- **Exact duplicate:** Same fact already exists → skip.
- **Evolution:** Existing fact on same topic but with different/updated claim → flag as update candidate (will replace existing file).
- **New:** No existing fact on this topic → flag as new addition.

## V3: Present for Approval

Present extracted facts to the user in a clear format:

```
## Voice Facts Extracted

### NEW (not in auto-memory)
1. [Directive] "Don't use emojis in code comments"
   → Would write to: feedback_no_emojis_in_code.md

2. [Belief] "Built artifacts matter more than career history for evaluation"
   → Would write to: user_artifact_evaluation.md

### UPDATES (evolves existing fact)
1. [Preference] "Keep responses under 5 lines" (currently: "under 10 lines")
   → Would update: feedback_no_broetry.md

### SKIPPED (already captured)
1. [Directive] "Never build deliverables without source recon" — exists in feedback_source_recon.md
```

User approves, rejects, or modifies each fact individually. Only approved facts proceed to V4.

## V4: Write to Auto-Memory

For each approved fact:

### New facts
Create a new auto-memory file with proper frontmatter:

```markdown
---
name: {{descriptive name}}
description: {{one-line description for MEMORY.md index}}
type: {{feedback|user|project}}
---

{{Fact content}}

**Why:** {{reason the user gave, or context from conversation}}
**How to apply:** {{when/where this should influence behavior}}
```

File naming: `{type}_{topic_slug}.md` (e.g., `feedback_no_emojis_code.md`, `user_morning_workflow.md`)

### Updates to existing facts
Edit the existing auto-memory file:
- Update the body content with the evolved fact
- Preserve the frontmatter structure
- Add a line: `**Updated:** {date} — {what changed}`

### Update MEMORY.md index
Add new entries or update descriptions for modified files.

## V5: Summary

After writing, report:

```
Voice extraction complete:
- {N} new facts written
- {M} facts updated
- {K} facts skipped (already captured)
- {J} facts rejected by user
```

---

## Cross-References
- `eos-recall-router`: Used in V2 for deduplication against existing auto-memory.
- `eos-memory-mgmt`: Voice-extract handles conversational fact capture. Memory-mgmt handles decision-lock event writes to Notion. Different triggers, complementary coverage.
- `eos-fact-check`: After voice-extract writes new facts, fact-check can verify consistency across layers.
- Auto-memory system: This skill is the intake mechanism for auto-memory. Fact-check is the maintenance mechanism.
- Kernel Rule 5 (Regression Lock): Extracted facts that reference locked variables should note the lock status.
