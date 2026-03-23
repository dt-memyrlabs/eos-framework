# Rule 9: Context Limit Monitor

## Purpose

Context Limit Monitor prevents state loss at context window boundaries. LLM sessions have finite context. Without active monitoring, critical state is lost when the window fills — locked variables, constraint classifications, thesis state, and USER MODEL all disappear. This rule enforces awareness of remaining capacity and mandates state preservation actions at defined thresholds.

The rule is environment-aware: SDK-based sessions (Claude Code) have exact token counts. Browser sessions (claude.ai) use exchange-count estimation.

## Mechanics

- **Environment detection**: At session start, detect whether SDK token counting is available. SDK available = exact token counts. SDK unavailable = exchange-count estimation with conservative margins.
- **70% threshold**: Alert fires with: approximate exchanges remaining, list of open threads, recommendation to park lowest-priority thread. Mandatory Notion state dump executes immediately — full project state written to Tier A storage. This is not optional. After the dump, work continues normally.
- **90% threshold**: No new threads opened. Active threads are either closed (with explicit conclusions) or produce final deliverables. The system shifts from exploration to conclusion mode. New topics are deferred to a new session.
- **CONTINUE [topic] (session bridge)**: On this keyword in a new session, the system queries Notion for the project's Spoke page to load last known state. Supplements with Pieces LTM if available. Loads: active goal, locked variables, open threads, last decision, and the exact point where the previous session stopped. USER MODEL is populated from loaded state. State summary is presented before work resumes.
- **State dump contents**: Full project state includes: locked goal, all locked variables with bases, constraint graph state, CCI-G with component breakdown, open threads with status, feasibility thesis state, USER MODEL snapshot.

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| 70% threshold missed | Context usage passes 70% without alert or state dump | Execute state dump immediately. Late dump is better than no dump. |
| State dump to Notion fails at 70% | Tier A write fails | Fall back to Tier C (inline state summary). Flag degraded persistence. Retry Notion on next exchange. |
| New thread opened after 90% | Fresh topic introduced past the 90% threshold | Reject. State: "Context at 90%. No new threads. Close active threads or produce deliverables. New topics go to next session via CONTINUE." |
| CONTINUE loads stale state | Notion Spoke page has not been updated since the state dump | Flag staleness. Compare Spoke page timestamp against expected last-write. Proceed with loaded state but note the gap. |
| Exchange estimation inaccurate | Actual context usage diverges from estimated (browser sessions) | Use conservative margins. Better to fire the 70% alert early than to miss it. |
| State dump missing critical variables | Dump omits locked variables or constraint state | Structural violation. State dump template is fixed — all components are mandatory. |

## Skill Cross-References

- **eos-memex**: Handles context compression at both the 70% and 90% thresholds. At 70%, compresses resolved threads to free capacity. At 90%, produces the final compressed state for session bridging.
- **eos-memory-mgmt**: Executes the mandatory state dump to Notion at 70%. Owns the Spoke page structure and section templates. Also handles state loading on CONTINUE via M1 (persistence tier detection) and subsequent Spoke queries.

## Examples

**70% alert and dump:**
System detects context at approximately 70%. Alert: "Context at ~70%. Approximately 15 exchanges remaining. Open threads: (1) constraint graph for hiring pipeline, (2) scoring model calibration, (3) outreach template drafting. Recommend parking outreach templates — lowest goal proximity." Notion state dump executes immediately with all locked variables, constraint states, and CCI-G breakdown.

**Session bridge via CONTINUE:**
New session starts. User types: "CONTINUE hiring pipeline." System queries Notion Spoke page for the hiring pipeline project. Loads: goal locked as "reduce time-to-qualified-candidate from 21 days to 10 days," 4 locked variables (ICP, scoring weights, source channels, interview stages), CCI-G at 72%, open thread on scoring model calibration. Presents state summary. Resumes from the scoring model calibration thread.
