# Contributing to EOS Framework

## How to Contribute

### Reporting Issues

Open a GitHub issue with:
- Which component is affected (kernel rule, skill name, or doc)
- What you expected vs what happened
- Your kernel version and relevant skill versions

### Proposing Changes

1. Fork the repo and create a branch
2. Make your changes
3. Run `tools/validate-skills.sh` to verify skill integrity
4. Open a PR with a clear description of what changed and why

## Kernel Modifications

The kernel (`kernel/CLAUDE.md`) has strict modification rules:

- **Compression prohibition**: Never fold, merge, or compress named behaviors. Every named behavior must map 1:1 between old and new versions.
- **Token ordering**: USER MODEL before Identity before Architecture before Rules. Do not violate this ordering.
- **Locked variables**: `compression_prohibition` and `token_ordering` are locked. Do not modify without explicit justification.
- **Compression audit**: Any kernel modification that removes or restructures content must include a compression audit table showing the disposition of every named behavior affected.
- **Version bump**: Any approved kernel change bumps the patch version (e.g., v20.1.0 to v20.1.1) and updates the date.

## Skill Standards

### YAML Frontmatter (required)

```yaml
---
name: eos-your-skill-name
version: "v1.0.0"
kernel_compat: "v20.1.0"
description: "Trigger documentation. Include: what triggers it, what signals to look for, and what NOT to trigger on."
---
```

### Structure

Every skill should include:
- **Trigger**: When the skill activates (explicit keywords, state transitions, metric thresholds)
- **Autonomy**: Which tier (1/2/3) for each operation
- **Steps**: Numbered procedure
- **Failure Modes**: Table with Failure | Detection | Response columns
- **Cross-References**: Which kernel rules and other skills it interacts with

### Naming Convention

`eos-[name].md` placed in the appropriate category directory:
- `skills/lifecycle/` — project initialization and goal management
- `skills/build/` — build/execution mode
- `skills/memory/` — persistence, retrieval, archival
- `skills/reasoning/` — constraint management, contradiction handling
- `skills/quality/` — self-correction, fact-checking, tone
- `skills/output/` — report generation, deliverables
- `skills/system/` — kernel updates, multi-agent, collaboration

### Version in Frontmatter, Not Filename

Skill versions live in the YAML `version` field. Do not include versions in filenames. The kernel's `skill_versions` parameter is the version registry.

## Documentation

- Rule docs (`docs/rules/`) supplement the kernel; they do not duplicate it
- Concept docs (`docs/concepts/`) explain mechanics with examples
- Keep docs concise: 40-80 lines per file
- No emojis, no marketing language

## Code of Conduct

Be direct, specific, and constructive. This project values clarity over politeness and substance over ceremony.
