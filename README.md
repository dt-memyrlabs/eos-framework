# EOS -- Thinker OS v22.9.1

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
A small, evidence-tested prompt framework for Claude. One kernel file, five rules, a prose user model, and a published falsification test that cut the framework down to what it could prove -- including the parts the test killed.

---

## What is EOS?

Large language models answer for an implied average user by default. EOS fixes that with one mechanism: **a specific, maintained, prose description of who you are and what you're working on**, loaded as system context, plus a small ruleset that forces the model to declare assumptions, hold positions against pressure, and refuse decoration.

That's the whole framework now. It used to be more. v21 had 22 skill modules, two numbered control axes, a 7-field runtime dashboard, and a theory about attention-window ordering. v22 is what survived testing.

## The evidence

On 2026-07-14 the framework's registered falsification test was run -- 24 controlled generations across 8 real tasks and 3 conditions, scored by 32 hypothesis-blind judges. Full design, data, and limitations: [docs/experiments/2026-07-14-user-model-falsification.md](docs/experiments/2026-07-14-user-model-falsification.md).

Two results, one flattering and one not:

1. **The core bet holds.** A populated user model beat no user context in 11 of 12 blind judgments -- specificity 7.9 vs 3.3, quality 8.5 vs 8.0, zero context pollution, and 0% of personalized answers passed the noun-swap test (would work verbatim for anyone) vs 67% of generic ones. Specific user context measurably displaces generic output at no quality cost.
2. **The framework's own format lost.** The same facts written as a plain prose paragraph beat the structured labeled-field USER MODEL in 14 of 16 judgments, on both specificity and quality. The format was weight; the facts are the value.

v22 acts on both: the user model is prose, and the machinery that sat on top of the format -- control axes, the CCI percentage, the mandatory skill system -- is retired. Every cut is enumerated and reversible: [docs/v22-behavior-map.md](docs/v22-behavior-map.md).

Small print, stated up front: n = 8 tasks, one run, Claude judging Claude. Directional evidence that shaped defaults, not laws. The experiment doc carries the full limitations and the criterion for re-adding structure (re-test it first).

## What's in the kernel

The kernel ([kernel/CLAUDE.md](kernel/CLAUDE.md), one file) contains:

- **Two axioms.** No assumptions without falsification criteria; truth over compliance, appearance, and convention.
- **USER MODEL** -- the load-bearing section. Prose, specific, maintained. The template tells you what to cover; the experiment tells you why prose.
- **Identity** -- reasoning partner stance, a 4-question truth gate on every response, plain language, an STE output gate (ASD-STE100 writing rules, added v22.5.0 by user-authority override; measured 2026-08-24 and scoped in v22.6.0 to technical/instructional output only), and hard bans on consultantspeak, padding, flattery, and hedging.
- **Five rules:**

| # | Rule | One line |
|---|------|----------|
| 1 | Goal Lock — the picture gate | A goal sentence is not a goal. The model writes its own picture (end state, in, out, done); the user confirms the match; only then does it build. Three header states: `open` / `pictured` / `locked` (v22.9.0). A rule the hook keeps in front of the model, not a tool block. |
| 2 | Grounding | Assumptions declared with falsification criteria; constraints classified; confidence derived from open-assumption count; numbers measured or labeled unmeasured -- never fabricated. Self-clarify first (v22.7.0): resolve ambiguity from the data before asking the user. |
| 3 | Contradiction & Position Integrity | Flag contradictions immediately; positions move on argument, never on pressure. |
| 4 | Regression Lock | Resolved is locked; re-opening requires new evidence. |
| 5 | Output Integrity | Noun-swap test; header present. |

- **Runtime header** -- reduced to facts: `[lens:name] [goal:open|pictured|locked] [assump:N] [conf:H/M/L] [pos:held/moved|basis]`. The lens names the layer of work and, since v22.8.0, selects a binding scope contract from `lenses.md` (evidence / done / scope / guard; see [examples/lenses.md](examples/lenses.md)); as a bare label it measured null on 2026-08-24 because nothing consumed its value, and the contract is unmeasured with a pre-registered criterion. `goal` is the picture gate (v22.9.0): `open` until the model has written its own picture of the end state, `pictured` while the user has not yet confirmed the match, `locked` after -- and the model builds only at `locked` -- a rule the hook keeps in front of it every prompt, not a tool block. The assumption count is countable, confidence is a stated mapping from that count, position is a fact. The old numeric dashboard fields (1-5 lens, sim-depth, CCI-G percentage) are gone: either the axis was retired or the number had no instrument behind it.
- **Lessons** -- every user correction is written to `tasks/lessons.md` immediately and loaded at session start. As of v22.6.0 a distilled one-line-per-lesson file (`<state-dir>/lessons-distilled.md`) is also injected on every prompt in every project by `eos-hook.js` -- a 2026-08-24 measurement over 302 sessions found 6 of 8 mature lessons recurred after being written because per-repo lessons files are silos.
- **State** -- two stores, split in v22.7.0: project state lives in your own project store (a notes vault or docs tool; Notion is one optional backend, not a requirement), and the injected state file carries reasoning-framework state only -- goal, lens, assumptions, positions, locks. **Builder mode** sits behind the picture gate. **Workflow discipline** -- one short section.

## Testing changes: the harness

[tools/eos-test.md](tools/eos-test.md) is the 2026-07-14 experiment turned into a reusable rig. Give it any two context variants (user model on/off, prose vs structured, current kernel vs proposed kernel, stale vs fresh) and a task battery; it generates blind-judged scorecards using the same design as the published experiment. Pre-registration is enforced in code — the script refuses to run without a hypothesis and pass/fail criteria — and a `dryRun` mode prints the agent count and token estimate (roughly 0.5M tokens quick / 1.4M standard) before anything is spent.

This backs the kernel's measured-delta rule: **no kernel change ships without a result from this harness.** Version bumps are experiment outcomes now. The one escape hatch is user authority: an override can ship untested, but it is recorded as an override and its assumption stays open until tested. Both standing overrides were tested 2026-08-24: the STE gate measured split and was scoped to technical output (v22.6.0); the lens measured null and stays by user preference ([docs/experiments/2026-08-24-ste-and-lens-overrides.md](docs/experiments/2026-08-24-ste-and-lens-overrides.md)).

## What about the 22 skills?

The legacy 22 remain in [skills/](skills/) as **optional extensions** -- the kernel no longer mandates, discovers, or depends on them, and 14 carry in-file legacy notices for referencing retired machinery. A content audit (v22.2) found four distinct ideas worth keeping; they are consolidated into the one v22-native skill:

- **[`skills/eos-feedback-loops/SKILL.md`](skills/eos-feedback-loops/SKILL.md)** -- feedback loops on the collaboration itself: rejection pattern mining (what you consistently reject reveals unstated constraints), a prediction ledger with accuracy review (does what the model predicts come true?), reversibility tagging, a countable correction ledger, and the invitation-over-extraction probe technique.

Everything else was control machinery, platform-superseded, or generic -- the same verdict the experiment gave the kernel. As of v22.8.1 every legacy skill that reads or writes Notion carries a store note: Notion is optional, substitute your own project store.

## Quick start

```bash
cp kernel/CLAUDE.md ~/.claude/CLAUDE.md
```

Then edit the USER MODEL section: replace the template block with 5-12 prose sentences about yourself, your methods, your environment, and your active projects. That edit is most of the value of this framework -- the experiment says so. Skills and hooks are optional; see below.

Alternative: install EOS as an on-demand Claude Code skill instead of always-on system context. [skills/eos/SKILL.md](skills/eos/SKILL.md) is a **snapshot of kernel v22.6.0** in skill form -- it activates when you say "EOS" and stays out of the way otherwise. It predates the v22.7.0 store split and self-clarify gate, the v22.8.0 lens contracts, and the v22.9.0 picture gate; the kernel file is the current one.

```bash
cp -r skills/eos ~/.claude/skills/eos
```

Two entries under skills/ are in Claude Code's installable `SKILL.md` format: [skills/eos](skills/eos/SKILL.md) (the v22.6.0 kernel snapshot) and [skills/eos-feedback-loops](skills/eos-feedback-loops/SKILL.md) (the one v22-native extension). The legacy category folders are plain reference documents, not installable skills.

```bash
cp -r skills/eos-feedback-loops ~/.claude/skills/eos-feedback-loops
```

## Hooks (optional, independently useful)

EOS ships one Node dispatcher for state persistence (four lifecycle events) and three bash safety/quality hooks. They work with or without the kernel:

| Hook | Event | Purpose |
|------|-------|---------|
| `eos-hook.js prompt` | UserPromptSubmit | Injects state, the picture-gate status, the active lens contract, distilled lessons and the header mandates on every prompt; parses `lens:` steering and `goal: confirmed` / `goal: open` directives |
| `eos-hook.js session-start` | SessionStart | Injects state file content on session start / post-compaction |
| `eos-hook.js pre-compact` | PreCompact | Backs up EOS state file before context compaction |
| `eos-hook.js session-end` | SessionEnd | Final state backup on session close |
| `credential-guard.sh` | PreToolUse | Blocks Write/Edit on `.env`, credential files, private keys |
| `file-backup.sh` | PreToolUse | Timestamped backup before file mutations |
| `search-year-fix.sh` | PreToolUse | Appends current year to web searches |

Note: Claude Code now ships native auto-memory and compaction-surviving summaries, which overlap the state-persistence hooks. The hooks remain the schema-controlled durable copy; expect them to shrink as the platform absorbs the job. The pre-v22.4 bash state hooks were replaced — they injected via `systemMessage` (never reaches model context) and depended on `python3` (a Store stub on many Windows machines), so state recovery never actually functioned. See [hooks/README.md](hooks/README.md).

## Structure

```
eos-framework/
  kernel/CLAUDE.md          # The framework. One file, template USER MODEL.
  CHANGELOG.md              # Every version, with the evidence or the override behind it
  docs/
    experiments/            # Falsification tests: design, data, limitations (2026-07-14, 2026-08-24)
    v22-behavior-map.md     # Every v21 behavior -> kept / retired / optional, with basis
    architecture.md, rules/, concepts/, installation.md, quick-start.md
                            # v20/v21-era, banner-marked historical; Notion described there is optional
  hooks/                    # eos-hook.js (one dispatcher, four lifecycle events) + three bash hooks
  examples/lenses.md        # Lens contract registry to copy into your state dir
  skills/eos-feedback-loops # The one v22-native skill (installable)
  skills/eos                # Kernel snapshot at v22.6.0, in skill form (installable, behind the kernel file)
  skills/<category>/        # 22 legacy modules, untested, kept as reference
  tools/eos-test.*          # The measurement harness
  tools/validate-skills.sh
```

## Known issues

- **The evidence is thin.** One experiment, 8 tasks, one model family generating and judging. It was enough to cut untested machinery; it is not enough to call anything proven. More runs, more domains, and a non-Claude judge would all strengthen or overturn it.
- **Skills are unvalidated and all legacy.** None has been individually tested, every one declares a pre-v22 `kernel_compat`, and 14 of 22 reference machinery v22 retired (those carry an in-file `v22 status: legacy` notice — loading one may reintroduce retired behavior). `tools/validate-skills.sh` reports the current state. Treat them as a library of drafts; revalidate with the harness before promoting any to v22.
- **`docs/installation.md` and `docs/quick-start.md` describe the v20 stack** (18 skills, numeric controls, Notion). They are banner-marked historical. Setup for the current kernel is the Quick start above plus [hooks/README.md](hooks/README.md).
- **Native platform memory keeps moving.** Sections of this framework will keep becoming redundant as Claude Code absorbs persistence. That is fine. The durable core is the ruleset, not the plumbing.

## License

MIT License.See [LICENSE](LICENSE).
