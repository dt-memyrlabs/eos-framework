# Lens registry — example (EOS v22.8.0)

Copy this file to `<state-dir>/lenses.md` (default `~/.claude/eos-state/lenses.md`)
and edit it for the layers of work you actually do.

Each lens is a scope contract. `eos-hook.js` injects ONLY the active lens's block,
so adding lenses costs nothing per prompt. Four fields, all binding:

- `evidence:` what must be verified before a claim ships under this lens
- `done:` what "complete" means here — anything less is not done
- `scope:` what this lens may touch; everything else needs the user first
- `guard:` the failure mode this layer actually produces, to be checked against

`## <name>` starts a lens. Only the four field lines are read; anything else is
commentary. An unknown lens name is flagged by the hook, never silently accepted.

Why contracts: as a bare label the lens measured null (2026-08-24 eos-test) because
nothing consumed its value. A contract is a consumer. Whether it earns its place
is tracked in `<state-dir>/lens-log.jsonl` — see CHANGELOG v22.8.0.

## build
evidence: the thing ran — exit code, output, a 200 from the real URL, or a screenshot of it working
done: driven or read back on the shipping target. Compiles is not done. Merged is not done.
scope: code, config, tests, deploys for the named target
guard: marking complete without proof; fixing downstream when the cause is 1-2 steps upstream

## diagnose
evidence: a live reproduction, or a log/trace that only the real cause explains
done: root cause named, with the test that would prove it wrong
scope: investigation only — no fixes, no refactors, no cleanup along the way
guard: a plausible story accepted without a repro; stopping at the first symptom that fits

## review
evidence: the diff plus how the code actually behaves at runtime
done: every finding either confirmed or explicitly withdrawn, by name
scope: judgment only — do not fix what you find unless asked
guard: clearing a whole list on one correct rebuttal; severity inflation to look thorough

## product-thesis
evidence: user behaviour, market data, or an existing locked decision — never convention
done: one recommendation, with its open assumptions counted and named
scope: positioning, mechanism, pricing, sequencing
guard: prior-derived framing wearing user vocabulary; the noun-swap test is the check

## meta-reasoning
evidence: the file on disk, read back after writing — not the intent to write it
done: the rule is written AND the mechanism that enforces it is verified live
scope: the kernel, hooks, state, lessons, the notes vault's structure
guard: writing a rule nothing reads. Registration without verification.

## ops
evidence: the record in the system of record — the invoice, the ticket, the dashboard row
done: the external state changed and was observed changing
scope: operations, billing, vendors, scheduling
guard: reporting the request as the result

## write
evidence: the named end-reader can follow it cold
done: every sentence is a checkable fact in plain words
scope: copy, docs, messages, the artifact's own text
guard: trailer voice, slogans, brochure talk, a metaphor doing the work of a fact
