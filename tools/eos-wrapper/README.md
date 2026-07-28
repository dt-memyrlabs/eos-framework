# Lock & Prune wrapper (experimental)

## Status: unvalidated draft

This is a small standalone script, not part of the EOS kernel. It has
not been run through the project's falsification harness
(`tools/eos-test.md`), so treat any claims about its benefits as
unverified until it has been.

## What it is

A local Python chat loop that talks to the Anthropic API directly and
persists a small amount of state between turns:

- `state_manager.py` — stores locked decisions, constraints, verified
  facts, and a pending-predictions ledger in JSON files under
  `eos_state/`, and keeps a bounded (last-50-turn) rolling session log.
- `eos_wrapper.py` — a REPL-style chat loop that builds a system prompt
  from the locked state on every turn, calls the Anthropic API, and
  looks for two plain-text conventions in the model's reply to update
  state: `LOCK DECISION: <decision> because <rationale>` and
  `VERIFY PREDICTION <id>: <status>`.

## What it is not

- It does not make Claude autonomous, persistent, or self-modifying.
  Every run is a fresh API call; the "memory" is just JSON files this
  script reads back in and re-injects as a system prompt.
- It does not reduce token usage by itself — every turn still sends the
  full locked-context block as part of the system prompt. The
  `session_log.json` history is capped at 50 turns, but nothing here
  does summarization or retrieval, so long-running use will still grow
  the system prompt as more decisions/facts/predictions accumulate.
- It's independent of the kernel/skills in the rest of this repo; using
  it does not change how kernel/CLAUDE.md behaves elsewhere.

## Setup

```bash
cd tools/eos-wrapper
pip install -r requirements.txt
cp .env.example .env   # then add your own ANTHROPIC_API_KEY
python eos_wrapper.py
```

## Origin

Drafted from an exploratory chat session (via Qwen Coder) that also
produced a lot of unvalidated "God Lens" / "auto status" narrative
content. That framing content was intentionally left out of this PR;
only the concrete, testable persistence mechanism is included here.
