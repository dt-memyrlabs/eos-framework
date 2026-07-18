# eos-test — the falsification harness

A reusable test rig. It answers one question: **does context/kernel variant A produce better answers than variant B, for real tasks, judged blind?** It is the tool behind the rule that no kernel change ships without a measured delta.

This is the 2026-07-14 experiment ([docs/experiments/2026-07-14-user-model-falsification.md](../docs/experiments/2026-07-14-user-model-falsification.md)) turned into a script. Same design: each task is answered under both variants, blind judges score each pair on specificity / portability (the noun-swap test) / quality-independent-of-personalization / pollution, presentation order alternates to cancel position bias.

## The discipline (enforced, not suggested)

1. **Pre-register.** The script refuses to run without a `hypothesis` and pass/fail `criteria` in its args. Write them before you see any results — they are echoed into the output so you can't quietly move the goalposts.
2. **Estimate first.** Run with `dryRun: true` (spawns zero agents, prints the agent count and token estimate) and approve the spend before the real run.
3. **Publish both outcomes.** Results go in `docs/experiments/`, including — especially — the ones that go against you.

## Cost

Agents per run = tasks × (2 generations + judges). Measured baseline: ~45k tokens per agent (2026-07-14).

| Mode | Setup | Agents | Est. tokens |
|---|---|---|---|
| Quick | 4 tasks, 1 judge | 12 | ~0.5M |
| Standard | 8 tasks, 2 judges | 32 | ~1.4M |
| Deep | 8 tasks, 3 judges | 40 | ~1.8M |

Quick mode is for direction-finding; don't publish conclusions from it. Standard is the default.

## Running it

In Claude Code, invoke the Workflow tool with this file's script and your args:

```
Workflow({
  scriptPath: "tools/eos-test.workflow.js",
  args: {
    hypothesis: "Prose-expanded fields will match plain prose (structure was never the problem; compression was)",
    criteria: "Supported if neither variant wins more than 60% of relevant judgments; refuted if either wins >=75%",
    situation: "<ground truth about the requester, one paragraph — judges see this>",
    variantA: { name: "prose", context: "What you know about the user:\n<prose paragraph>" },
    variantB: { name: "expanded-fields", context: "What you know about the user:\n<field-per-sentence version>" },
    tasks: [ ...contents of task-battery.default.json, or your own... ],
    judges: 2,
    dryRun: true   // first pass; flip to false after approving cost
  }
})
```

The `context` string is injected verbatim as what the assistant knows. That makes the harness generic — anything you can express as a context difference, you can test:

- user model **on vs off** (the original experiment)
- **prose vs structured** formats (the experiment that cut v21)
- **stale vs fresh** user model (kernel claims sparse > stale; unmeasured)
- **header on vs off**, **rules on vs off** — put the full kernel text in `context`
- **v22 vs v23-candidate** before bumping a version

## Reading results

The run returns `{summary, perTask}`. `summary.relevant.wins` is the headline; check `meanQuality` for a personalization tax, `portableRate` for the noun-swap test, `pollutionRate` and the `neutral` block for over-application. `perTask[].judgments[].rationale` is where the actual insight lives — read them before believing the numbers.

## Known limitations (inherited from the original experiment)

Small n per run; same model family generating and judging; judges can't be blinded to which answer is personalized (only to the hypothesis). Treat single runs as directional. Repeat before acting on a surprise.
