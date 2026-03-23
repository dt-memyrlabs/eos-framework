---
name: eos-report
version: "v1.0.1"
kernel_compat: "v20.2.0"
state: trigger-ready
description: "Structured report synthesis using ReACT (Reasoning + Acting) pattern. Compiles project state into a deliverable report by pulling from Notion Spoke, Memex archive, constraint graph, and conversation history. Triggers on 'generate report', convergence declaration, or explicit request. Produces markdown report with mandatory multi-source cross-referencing. Do NOT trigger during active goal framing or mid-simulation — reports synthesize completed or near-completed work, not in-progress reasoning."
---

# EOS Report Skill — Structured Synthesis

**Trigger:** "Generate report" / "project report" / convergence declared (C8) / explicit request.
**Requires:** Goal locked. CCI-G > 0% (something to report on).
**Kernel rules in play:** Rule 2 (Generation Frame — condensed per builder pattern), Rule 3 (CCI), Rule 10 (Output Integrity — noun-swap test. Report is a deliverable, exempt from 10-line limit).

---

## R1. Source Inventory

Before generating, enumerate available sources:

| Source | Location | Content type |
|---|---|---|
| Notion Spoke | Tier A query | Goal, locked variables, decisions, constraints, assumption log, blockers, outcome log |
| Constraint Graph | `eos-constraint-graph` / Notion | Node/edge state, dependency chains, contradiction history |
| Memex Archive | Index map + Notion/Obsidian | Archived evidence blocks, tool outputs, prior analysis |
| Contradiction History | `eos-contradiction` C5 | Rejected trajectories, objection patterns, position movements |
| Conversation History | Current session | Recent simulation disclosures, user decisions, unarchived context |

**Minimum viable report:** Notion Spoke OR conversation history must be available. If neither, halt: "No source material for report generation."

---

## R2. Report Structure

Every report follows this skeleton:

```markdown
# [Project Name] — Report
**Date:** [date] | **CCI-G:** [current]% | **Status:** [active/converged/blocked]

## Executive Summary
[3-5 sentences. Goal, current state, key finding or recommendation.]

## Goal & Thesis
[Locked goal statement. Feasibility thesis. Thesis assumption status.]

## Key Decisions
[Each decision with tag (R/I), rationale, and outcome if known.]

## Constraint Landscape
[Hard/Structural/Assumed breakdown. What's holding. What was challenged.]

## Dependency Analysis
[If constraint graph active: critical paths, cascade risks, orphan flags.]

## Open Items
[Unresolved assumptions, active blockers, open threads.]

## Trajectory History
[If trajectory enumeration occurred: paths considered, killed, survived, and why.]

## Recommendation
[If not converged: recommended next action with reasoning.
If converged: final outcome summary.]
```

Sections with no content are omitted, not filled with placeholders.

---

## R3. ReACT Synthesis Loop

Each section is generated through a Thought-Action-Observation cycle:

### R3.1: Planning Pass
1. Read report skeleton (R2).
2. For each section, identify which sources (R1) contain relevant content.
3. Produce a section plan: `[section] → [sources to query] → [what to extract]`.

### R3.2: Section Generation
For each section in order:

1. **Thought:** State what this section needs and which sources to query.
2. **Action:** Query the source(s). Minimum 2 sources per section where available. Single-source sections are flagged with confidence note.
3. **Observation:** Extract relevant content from query results.
4. **Synthesis:** Write the section from observations. No invented content — every claim traces to a source.

**Cross-referencing mandate:** If a decision is reported, check it against the constraint graph for downstream impact. If an assumption is reported, check contradiction history for challenges. If a recommendation is made, check it against killed trajectories to avoid zombie paths.

### R3.3: Coherence Pass
After all sections generated:
1. Read the full draft as a unit.
2. Check for contradictions between sections.
3. Check that Executive Summary accurately reflects the body.
4. Check that Recommendation doesn't repeat a killed trajectory.
5. Trim redundancy between sections.

---

## R4. Output Delivery

### Format
Markdown by default. User can request alternative formats.

### Delivery
1. Present report inline in conversation.
2. If report exceeds 50 lines, also write to file: `[project-name]-report-[date].md` in working directory.
3. If Notion available, append to Spoke under `## REPORTS` section with date.

### Memex Integration
After delivery, if report was generated from Memex-archived content, the report itself becomes a Memex candidate. Compress into index entry (`[project]-report-[date]`) if context pressure warrants.

---

## R5. Incremental Reports

Not every report is a full synthesis. Support three modes:

| Mode | Trigger | Scope |
|---|---|---|
| **Full** | Convergence, explicit "full report" | All sections |
| **Status** | "Status report", "where are we" | Executive Summary + Open Items + Recommendation only |
| **Delta** | "What changed since last report" | Only sections with new content since last report generation |

Delta mode requires a prior report timestamp to diff against. If no prior report exists, fall back to Full.

---

## R6. Quality Gates

Before delivering any report:

1. **Source coverage:** Did every section query at least one source? Single-source sections flagged.
2. **Contradiction check:** Does the report internally contradict itself?
3. **Zombie check:** Does the recommendation match a previously killed trajectory?
4. **Staleness check:** Is any cited evidence older than 10 exchanges without re-validation?
5. **Goal alignment:** Does the Executive Summary connect back to the locked goal?

Failed gates are fixed before delivery, not flagged post-delivery.

---

## Failure Modes

| Failure | Detection | Response |
|---|---|---|
| No sources available | R1 inventory returns empty | Halt with explanation. Cannot generate from nothing. |
| Single-source report | All sections from one source only | Flag low confidence. Recommend waiting for more evidence. |
| Contradicts own content | R3.3 coherence pass catches | Fix before delivery. |
| Recommendation matches killed trajectory | R3.3 zombie check | Replace with surviving trajectory recommendation or flag gap. |
| Report too large for context | >100 lines generated | Write to file, present summary inline, compress full report to Memex. |

---

## Cross-References

- **Rule 2 (Simulation):** Report generation runs condensed simulation (builder pattern D4) — one-line disclosures, expand only on flags.
- **Rule 3 (CCI):** Report includes CCI-G snapshot. Report generation does not change CCI-G.
- **eos-constraint-graph:** Dependency Analysis section queries graph directly.
- **eos-contradiction:** Trajectory History section pulls from contradiction history (C5).
- **eos-project-mgmt:** Key Decisions pulls from C2 decision log. Open Items pulls from C3 blockers.
- **eos-memex:** Reports are Memex compression candidates. Archived evidence is a report source.
- **eos-memory-mgmt:** Report delivery to Notion follows M4 writeback policy (Tier 2 — notify).
