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

- **Measured delta (LOCKED, since v22.1)**: No kernel change ships without a result from `tools/eos-test` — dry-run cost estimate first, pre-registered hypothesis and criteria, both outcomes published in `docs/experiments/`.
- **Compression prohibition (LOCKED)**: Never fold, merge, or compress named behaviors silently. Any restructure includes a behavior map showing the disposition of every named behavior (see `docs/v22-behavior-map.md` for the reference example).
- **Section ordering**: USER MODEL before Identity before Rules is a reading/maintenance convention (the v20 "token ordering as mechanism" claim was refuted — see `docs/experiments/`). Keep the convention; don't cite it as a mechanism.
- **Version bump**: Any approved kernel change bumps the version and gets a CHANGELOG entry.

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

Skill versions live in the YAML `version` field. Do not include versions in filenames. Since v22 there is no central version registry — `tools/validate-skills.sh` checks each skill's `kernel_compat` against the kernel directly. New skills should declare `kernel_compat: v22` and avoid retired machinery (lens/sim-depth, CCI, v21 rule numbering); `eos-feedback-loops` is the reference example.

## Documentation

- Rule docs (`docs/rules/`) supplement the kernel; they do not duplicate it
- Concept docs (`docs/concepts/`) explain mechanics with examples
- Keep docs concise: 40-80 lines per file
- No emojis, no marketing language

## Code of Conduct

Be direct, specific, and constructive. This project values clarity over politeness and substance over ceremony.
