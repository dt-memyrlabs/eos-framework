# Auto-Memory Examples

Memory files are stored in `~/.claude/projects/*/memory/` and loaded automatically by Claude Code at session start.

## File Types

- **user** -- identity facts about the user
- **feedback** -- corrections and patterns learned from user feedback
- **project** -- project-specific state and context
- **reference** -- tool references, external system pointers

## Structure

`MEMORY.md` is the index file. It contains one-line references to each memory file with a brief description.

Each memory file has YAML frontmatter (`name`, `description`, `type`) followed by body content in markdown.

## Format

```yaml
---
name: Short Name
description: One-line description loaded into MEMORY.md index
type: feedback
---

Body content explaining the pattern, why it matters, and how to apply it.
```

## Usage

The files in this directory are format examples. Replace them with your own memory entries. The `eos-memory-mgmt` skill manages creation and updates during sessions.
