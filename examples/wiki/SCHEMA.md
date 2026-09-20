# Wiki schema

This file is the rulebook for every agent that writes in `<vault>/wiki/`. Copy it to `<vault>/wiki/SCHEMA.md` and edit the names rule and the project values. It follows the LLM-wiki pattern (Karpathy gist 442a6bf5): an agent-written, interlinked set of markdown pages that sits between the user and the raw sources. the user reads it; agents write it.

## Layers

| Path | What it is | Who writes it |
|---|---|---|
| `wiki/raw/sessions/<group>/<date>-<id8>.md` | Digest of one Claude Code session: the user's words, Claude's words, tool calls, files, commits. Secrets redacted. Immutable. | `wiki/tools/digest-sessions.js` only |
| `wiki/raw/manifest.json` | One row per transcript found: status, paths, sizes. | the same script |
| `wiki/sessions/<group>/<date>-<id8>[-slug].md` | One page per session. The documentation of that session. | one agent per session |
| `wiki/projects/<project>.md` | Current state of one project, built from its session pages. | one agent per project |
| `wiki/index.md` | Catalog of every page with a one-line summary. | `wiki/tools/build-index.js` |
| `wiki/log.md` | Append-only record of ingests and lint passes. | `wiki/tools/build-index.js` |

`<group>` is where the transcript was stored (set in `wiki/project-map.json`, "groups"). It is a storage fact. `project` in the page frontmatter is what the session was actually about, and it can differ from the group.

## Hard rules for every page

1. **Facts only, from the source.** Every statement must be supported by the digest you were given. If the digest does not say it, do not write it. Where a section has nothing, write `Not stated in the digest.` Never guess an outcome. "Claude said it was done" and "it was verified" are different facts: say which one the digest shows.
2. **No secrets.** Never copy a key, token, password, connection string or anything marked `[REDACTED...]`. If you see something that looks like a live credential that was not redacted, do not copy it, and report it in your structured result under `secret_seen`.
3. **Plain language.** Short sentences. Write so a smart reader who was not in the session can follow. Explain a term the first time you use it. No marketing voice, no filler, no praise.
4. **Absolute dates.** `2026-09-12`, never "yesterday" or "last week".
5. **The user's own words for decisions.** When the user decided, corrected or approved something, quote them, in quotation marks, at most 25 words per quote.
6. **Names.** List your product, company and system names here, spelled the way you want them, so agents do not invent variants.
7. **Links.** Obsidian wikilinks with the full vault path and a label: `[[wiki/projects/product-a|Product A]]`. Link the project page and the raw digest from every session page. Link another session only if the digest names it.
8. **No framework header.** Pages are documents. Do not put any `[lens:...]` runtime header, greeting or sign-off in a file.
9. **Numbers, ids and times.** Every count, amount, percentage, date, clock time, duration, version, commit hash, PR, issue, work-order or run id on a page must appear in the digest. Copy it; never round it, convert it, or work it out. If you are not sure, leave it out. A wrong number in documentation is a lie. Quotation marks hold the exact words of the person named; if you are paraphrasing, do not use quotation marks. Words Claude wrote are never attributed to the user. A proposal is not a decision.
10. **Cut digests.** If the digest header says `digest_level` is anything other than `full`, say so in the page under "Limits of this page".

## Project values

Use exactly one of these for `project`. The list lives in `wiki/project-map.json` ("projects"); keep this table in step with it.

| Value | Use it when the session is about |
|---|---|
| `product-a` | your main product: code, production, customers |
| `framework` | the EOS kernel, hooks, lenses, lessons |
| `vault` | the notes vault, this wiki, task capture |
| `system` | the machine, Claude Code setup, MCP servers, skills, tooling |
| `other` | none of the above; say what in the summary |

An automated agent run that works on a product's code takes that product's value, with `kind: agent-run`.

## Session page template

Write exactly this structure. Keep every heading, in this order.

```markdown
---
type: session
session_id: <full id from the digest>
title: "<specific title, max 70 characters, no quotes inside>"
date: <started date, YYYY-MM-DD>
ended: <ended date, YYYY-MM-DD>
group: <group from the digest>
project: <one project value>
kind: <interactive | scheduled-task | agent-run>
status: <completed | partial | blocked | failed | abandoned | informational>
branch: "<git_branch from the digest>"
worktree: "<worktree from the digest, or none>"
models: "<models from the digest>"
human_turns: <number from the digest>
entities: [<work order, PR, issue ids, file or feature names that matter, max 12>]
---

# <same title>

## Summary
Two to four sentences. What the session was for, what came out of it, and how it ended.

## What the user asked for
The request or requests, in order. For a scheduled task or an automated agent run, say what triggered it and what the task was.

## What was done
The work, in order, as short bullets. Name files, commands, tools and systems. Say what changed in the world: files, database, deploys, settings.

## Decisions and locks
Decisions made in this session and who made them. Quote the user. If none: `None recorded.`

## Verification
What was actually proven, and how (test run, read-back, browser check, query). Separate "verified" from "claimed". If nothing was verified, say so.

## Corrections from the user
Each time the user corrected Claude: what was wrong, what they said. If none: `None recorded.`

## Open at the end
What was left unfinished, blocked, or waiting on a decision. If the session ended mid-task, say where it stopped.

## Files, commits and deploys
From the digest lists: the files that matter most (max 15), each commit message, each push / PR / deploy / migration.

## Limits of this page
Digest level, anything the digest cut, anything you could not determine.

## Links
- Project: [[wiki/projects/<project>|<project>]]
- Raw digest: [[<digest path without .md>|digest]]
- Transcript: `<transcript path from the digest>`
```

Status values:
- `completed` — the request was finished, and the digest shows it.
- `partial` — some of it was finished.
- `blocked` — stopped on something outside the session (access, a decision, a failing service).
- `failed` — the run errored out or produced nothing usable.
- `abandoned` — the user dropped it or changed direction.
- `informational` — a question was answered; nothing was built.

## Project page template

```markdown
---
type: project
project: <value>
updated: <date of the newest session used>
sessions: <count>
---

# <Project name> — current state

## Where it stands
The state as of the newest session. What works, what is live, what is not.

## Open threads
Each unfinished item, the session it comes from, and what it waits on. Newest first.

## Decisions in force
Decisions that still hold, with the date and the session. If a later session reversed one, show only the later one and say it replaced the earlier.

## Timeline
One line per session or per cluster of sessions, oldest first, with links.

## Recurring problems
Things that went wrong more than once, and corrections the user had to repeat.

## Key entities
Work orders, PRs, issues, systems, files that matter, one line each.

## Contradictions and stale claims
Where two sessions disagree, or a claim was never verified. Do not resolve them by guessing.
```

## Operations

- **Ingest:** run `node wiki/tools/digest-sessions.js`, then one agent per new digest writes the session page, then `node wiki/tools/build-index.js`, then the agents for the affected project pages.
- **Query:** read `wiki/index.md` first, then the project page, then session pages, then the digest. Only open a transcript if the digest cut what you need.
- **Lint:** `build-index.js --lint` reports pages missing frontmatter or headings, digests with no page, broken links, and secret patterns.
