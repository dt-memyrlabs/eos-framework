# Skill Authoring

How to write a new EOS skill module.

---

## Overview

Skills are modular extensions to the EOS kernel. Each skill handles a specific capability that activates on defined triggers and operates within kernel rule boundaries. Skills do not duplicate kernel rules -- they reference them.

A skill is a single Markdown file with YAML frontmatter. It lives in a category directory under `skills/`.

---

## File Structure

### Naming convention

```
eos-[category]-[name].md
```

The `eos-` prefix is mandatory for official EOS skills. Category reflects the directory the skill lives in. Name describes the capability.

Examples:
- `eos-cold-start.md` (lifecycle category, but "lifecycle" is implied by directory)
- `eos-constraint-graph.md` (reasoning category)
- `eos-memory-mgmt.md` (memory category)

Exception: `tangent-drift-score.md` predates the naming convention and is grandfathered.

### Directory placement

```
skills/
  lifecycle/       # Session and project lifecycle management
  build/           # Artifact construction
  memory/          # Persistence, recall, knowledge graphs
  reasoning/       # Logic, constraints, contradictions
  quality/         # Self-monitoring, verification, voice
  output/          # Deliverable generation
  system/          # Multi-agent, collaboration, kernel updates
```

Place your skill in the category that best describes its primary function. If it spans categories, choose the one it triggers from most frequently.

---

## YAML Frontmatter

Every skill must have YAML frontmatter with three required fields and one strongly recommended field.

```yaml
---
name: eos-example-skill
version: "v1.0.0"
kernel_compat: "v20.0.0"
description: "One paragraph that serves as the trigger document. Describes when this skill activates, what triggers it, and what it does NOT trigger on. Be specific about trigger conditions -- vague descriptions cause false activations."
---
```

### Required fields

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Unique identifier. Must match the filename without `.md` extension. |
| `version` | string | Semantic version in quotes. Increment on any behavioral change. |
| `kernel_compat` | string | Minimum kernel version this skill is tested against. The kernel's skill integrity check compares this field against the running kernel version on every kernel upgrade. |

### The `description` field

The description is not documentation -- it is the **trigger document**. The model reads this field to determine whether to activate the skill. Write it as a precise activation specification:

- State the exact trigger conditions (user keywords, state transitions, metric thresholds).
- State what does NOT trigger it (false positive exclusions).
- Keep it to one paragraph. Long descriptions dilute trigger precision.

Example from `eos-cold-start`:

```yaml
description: "New project creation and initialization. Triggers whenever the user says 'new project', 'start a project', 'create a project', 'spin up a project', or any equivalent phrasing that indicates they want to begin tracking a new initiative. Also triggers when the user names something that doesn't exist in the Hub and wants to formalize it. Creates Notion Hub entry and Spoke with Core sections. Do NOT trigger for casual mentions of ideas or brainstorming -- only when the user signals intent to track and manage."
```

---

## Skill Body Structure

After the frontmatter, the skill body follows a consistent pattern.

### Header block

```markdown
# Module [Letter]: [Name]

**Trigger:** [Concise restatement of activation condition]
**Kernel rules in play:** [List specific rules this skill operates under]
```

The "Kernel rules in play" line is critical. It declares which kernel rules govern this skill's behavior. This is not decorative -- it tells the model which rules to resolve against during skill execution.

### Steps

Number steps sequentially. Each step is a discrete action or decision point.

```markdown
## Steps

### [Letter][Number]. [Step Name]
[Action description. Reference kernel rules by number when behavior depends on them.]
```

Steps should be imperative: "Check persistence tier," "Extract goal statement," "Write to Notion Spoke." Not "The system checks" or "This step involves."

### Decision points

When a step has branching logic, use explicit conditionals:

```markdown
### A3. Storage Classification
- Notion MCP available -> Tier A. Proceed to A4.
- Notion unavailable, Pieces available -> Tier B. Flag reduced persistence.
- Neither available -> Tier C. Flag conversation-only state.
```

### Kernel rule references

Reference rules by number and name. Do not restate the rule -- the kernel is already in context.

```markdown
Per Rule 1 (Goal Lock), do not proceed without an explicit goal.
```

```markdown
Autonomy per Rule 6: this step is Tier 1 (auto-approved).
```

---

## Trigger Patterns

Skills activate on one or more trigger types.

### Explicit user keywords

The most common trigger. The user says specific words or phrases.

```yaml
description: "Triggers on 'new project', 'start a project', 'spin up a project', or equivalent."
```

Be exhaustive with keyword variants in the description. The model matches against natural language, not regex -- but specificity reduces false positives.

### State transitions

The skill activates when a kernel state variable crosses a threshold.

```yaml
description: "Triggers when CCI-G reaches 80%. Runs Limiter Analysis automatically."
```

### Metric thresholds

Similar to state transitions but based on continuous metrics rather than discrete state changes.

```yaml
description: "Triggers when ltm counter reaches 5 or higher. Flags persistence staleness."
```

### Compound triggers

Some skills have multiple independent triggers:

```yaml
description: "Triggers on: (1) user says 'check facts' or 'verify', (2) a claim is made at HIGH confidence without supporting evidence, (3) user challenges a factual assertion."
```

---

## Autonomy Tier Assignment

Every skill step operates at an autonomy tier defined by kernel Rule 6.

| Tier | Behavior | Use for |
|------|----------|---------|
| Tier 1 | Full autonomy. Executes without user confirmation. Logged as "auto-approved per Tier 1." | Routine operations, state detection, assumption validation, correcting active violations. |
| Tier 2 | Notify only. Executes and informs user. Batched at session end. | Low-risk decisions, first-time flags, external blocker resolution. |
| Tier 3 | Require confirmation. Asks user before executing. | Goal shifts, rule amendments, high-risk irreversible decisions, hard limit conflicts. |

Assign the tier explicitly in each step:

```markdown
### A4. Create Spoke Page
Autonomy: Tier 1.
Create the Notion Spoke page with Core sections...
```

Default conservative: if unsure, assign Tier 2 or 3. Tier 1 is reserved for operations that are clearly safe to execute without user input.

Subagent ceiling: skills spawned via `eos-multi-agent` default to Tier 2 ceiling. Tier 1 override requires explicit per-spawn declaration.

---

## Failure Modes Table

For skills that handle complex operations, include a failure modes table at the end. This documents known failure conditions and their handling.

```markdown
## Failure Modes

| Condition | Detection | Response |
|-----------|-----------|----------|
| Notion MCP unavailable | M1 tier detection returns no Notion tools | Degrade to Tier C. Flag CCI-F impact. Proceed. |
| User provides vague goal | Goal statement fails specificity check | Push for specificity per Rule 1. Do not proceed. |
| Spoke page already exists | Notion search returns existing page for project name | Load existing Spoke. Do not create duplicate. |
```

---

## Cross-Referencing Other Skills

Skills can reference other skills when their operations depend on or trigger them.

```markdown
After goal-lock, `eos-goal-framing` may trigger independently to extract the feasibility thesis.
```

Do not embed another skill's logic. Reference it by name and let the kernel handle activation. Duplicating logic across skills creates maintenance drift.

---

## Registration

After writing a skill, register it in the kernel's Runtime Parameters:

1. Add the skill to `skill_versions` with its version string.
2. Add the skill to `module_state` with its activation mode (`trigger-ready`, `auto-monitor`, or `active when [condition]`).

The kernel's skill integrity check validates all registered skills on every kernel version change. Unregistered skills will not be flagged as missing -- they will simply not be validated.

---

## Checklist

Before shipping a new skill:

- [ ] Filename matches `name` in frontmatter.
- [ ] `version` is quoted and follows semantic versioning.
- [ ] `kernel_compat` references a real kernel version.
- [ ] `description` is a precise trigger document with false-positive exclusions.
- [ ] Every step has an explicit autonomy tier assignment.
- [ ] Kernel rules are referenced by number, not restated.
- [ ] No logic duplicated from other skills.
- [ ] Failure modes table covers known edge cases.
- [ ] Skill registered in kernel `skill_versions` and `module_state`.
- [ ] `validate-skills.sh` passes with the new skill included.
