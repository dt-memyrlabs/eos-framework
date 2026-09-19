# Session wiki tools

These tools turn Claude Code transcripts into an agent-written wiki inside your project store. The pattern is the LLM wiki (Karpathy, gist 442a6bf5): raw sources, a wiki layer that agents write, a schema file, an index, a log, and three operations (ingest, query, lint).

## Files

| File | What it does |
|---|---|
| `digest-sessions.js` | Reads `~/.claude/projects/*/*.jsonl`. Writes one redacted digest per session to `wiki/raw/sessions/<group>/` and `wiki/raw/manifest.json`. |
| `workflow-session-pages.js` | Workflow script. One small-model agent per session reads one digest and writes one session page. |
| `build-index.js` | Builds `wiki/index.md`, the per-project listings in `wiki/sessions/_by-project/`, stub pages, `wiki/lint-report.md` and the `wiki/log.md` entry. |
| `check-quotes.js` | Checks every quotation on every session page against the transcript: found in the user's text, only in Claude's text, in tool input or output, or nowhere. Writes the result on the page under "Limits of this page" and a summary to `wiki/quote-report.md`. |
| `workflow-project-pages.js` | Workflow script. One agent per project writes `wiki/projects/<project>.md`. Verifier agents check a sample of session pages against digest and transcript, and fix what is wrong. |
| `../SCHEMA.md` | The rules and page templates. Every agent reads it first. |
| `../project-map.json` | Your project values, kinds, the working-directory-to-project map for the hook, and the transcript-folder-to-group map. |

## Set up

1. Copy this folder to `<vault>/wiki/tools/`. The scripts find the vault as the folder two levels above them. `EOS_VAULT` overrides that.
2. Copy `examples/wiki/SCHEMA.md` and `examples/wiki/project-map.json` to `<vault>/wiki/`. Edit the project values, the names rule and the maps.
3. Set `EOS_VAULT` to the vault path so the session-start hook can inject the project page.

## Ingest

1. Run `node wiki/tools/digest-sessions.js --days 31`. WARNING: a full run deletes and rebuilds `wiki/raw/sessions/`. Do not run it while agents are reading digests. `--only <id-prefix>` rebuilds one digest and deletes nothing.
2. Run `node wiki/tools/build-index.js --lint`. Each `MISSING PAGE` line is a session to document.
3. Run the session-pages workflow with `args = { vault, items }`. Each item is `{ id8, digest, page, lines, level }`, all in `manifest.json`. Run 3 sessions first and read the pages before you run the rest.
4. Run `build-index.js` again. It writes the listings the project agents read.
5. Run the project-pages workflow with `args = { vault, projects, sample }`.
6. Run `node wiki/tools/check-quotes.js`. In the first build 119 of 510 quotations were found nowhere in the transcript: a small model puts its own paraphrase in quotation marks. The script labels those on the page.
7. Run `node wiki/tools/build-index.js --lint --log "ingest | <what ran>"`. Fix every `SECRET PATTERN` line before you do anything else.

## What the digest keeps and drops

- Keeps: the user's text, Claude's text, one line per tool call (file path or the first part of the command), tool errors, compaction summaries, the lists of files edited, commits and push/deploy commands.
- Drops: tool output, hook injections, system reminders, thinking blocks, subagent transcripts, images.
- Caps: 120,000 characters per digest. If a session is larger, the script tightens the per-message caps, then drops tool lines, then cuts the middle. The digest header states the level, and the page must repeat it under "Limits of this page".
- Window: a session is in the window if its last message is inside it. The file's modified time is not used, because transcripts get re-touched long after they end.
- Redaction: key and token patterns, passwords in URLs, `key = value` assignments, long hex strings, and long unbroken strings that do not read like a file path. Redaction is pattern-based. It is not a guarantee. The lint scan is the second check.

## Known limits

- A session page records what the transcript says, including what Claude claimed. The template separates "verified" from "claimed". It cannot check either.
- A small model writes the session pages. In the first build a 10-page fact-check found 3 pages accurate, 6 with minor errors (paraphrase shown as a quote, a wrong timestamp, one invented run id, corrections left out) and 1 with major errors: on a long session with a cut-down digest, Claude's proposals were recorded as decisions the user had locked, and merge times were wrong by hours. Long sessions are where the small model fails; check those pages first. The verifier sample measures the error rate; it does not remove it.
- `build-index.js` repairs session links that dropped the title part of the file name, using the 8-character id.
- Project pages are a record of past sessions. Check live state before you act on them.
