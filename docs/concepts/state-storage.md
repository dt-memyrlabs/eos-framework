# State Storage

EOS uses a 3-tier state storage system. Tier detection is a HARD GATE at session start -- no substantive output until the active tier is established. The `eos-memory-mgmt` skill runs M1 to classify.

## Tier A: Notion (Primary)

Notion is the authoritative store. Every decision-lock event writes immediately via MCP tools. When Pieces and Notion conflict, Notion wins.

**Spoke/Hub structure:** Each project gets a Spoke page containing standardized sections: ACTIVE GOALS, GOAL LOG, LOCKED VARIABLES, CONSTRAINT GRAPH, DECISION LOG, USER MODEL SNAPSHOT, OPEN THREADS, SESSION HISTORY. The Hub page aggregates cross-project state.

**Requirements:** Notion MCP tools must be available and authenticated.

## Tier B: Pieces LTM (Supplementary)

Cross-environment ambient capture. Pieces supplements Notion as a secondary record. Since v20, Pieces is a read source, not a write target -- the system queries it for context but does not write state to it.

Pieces failure does not degrade CCI. The system continues at full capability with Notion alone.

## Tier C: Claude Native (Fallback)

When neither Notion nor Pieces is available, state persists only in conversation history via `conversation_search` and `recent_chats`. Single-source recall from conversation history is MEDIUM confidence until cross-validated.

State dies with the session. The kernel still functions -- it loses cross-session memory fidelity.

## Decision-Lock Events

These 13 events trigger immediate writes to the persistence layer:

| Event | Source Rule |
|-------|------------|
| Goal locked | Rule 1 |
| Goal moved | Rule 1 |
| Variable locked | Rule 5 |
| Constraint promoted | Rule 2 |
| I-tagged decision (high-risk) | Rule 6 |
| Hard limit conflict resolved | Rule 7 |
| Feasibility thesis locked | Rule 2 |
| Agreement (bilateral) | Rule 4 |
| Concession | Rule 4 |
| CCI-G hits 80% | Rule 3 |
| Convergence declared | Rule 3 |
| Context threshold (70%) | Rule 9 |
| USER MODEL updated | Rule 7 |

Each write includes: event type, active project identifier, and timestamp context.

## Drift Detection

At session start, the system queries Notion for the project's Spoke page and compares stored state against current conversation claims. Discrepancies are flagged before any work proceeds.

| Tier | Drift Detection Method |
|------|----------------------|
| A | Notion Spoke query |
| B | `ask_pieces_ltm` |
| C | `conversation_search` + `recent_chats` |

## LTM Staleness Monitor

The runtime header includes `ltm:X` -- a counter of exchanges since the last Notion decision-lock write. When this counter reaches 5 or more, a staleness warning fires. The counter is inactive when operating at Tier C only or when no decision-lock events have occurred in the session.
