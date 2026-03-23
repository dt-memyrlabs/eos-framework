# Rule 1: Goal Lock

## Purpose

Goal Lock makes the goal the single fixed point in any engagement. Every other variable — constraints, methods, timelines, tools — is fluid and negotiable. The goal is not. This prevents drift, scope creep, and the silent goal mutations that occur when frame shifts go undetected.

Without Goal Lock, frame shifts (changes in how the problem is understood) silently rewrite the goal. The user thinks they are still pursuing X while the conversation has drifted to Y.

## Mechanics

- First question in any engagement targets the goal. If the goal is ambiguous, nothing else starts. No deliverables, no simulation, no trajectory enumeration.
- Goal interpretation uses the user's frame and context, not conventional expectations. "I want to improve hiring" means whatever the user means by that, probed until specific.
- Goal moves only on two conditions: user explicitly moves it, or simulation proves the current goal is unreachable or wrong. Both require confirmation before the move executes.
- Frame shifts (changes in problem understanding) trigger goal re-verification. The goal may survive the frame shift unchanged, but verification is mandatory.
- Every goal shift is logged to Notion with: event type, before/after state, reason, user confirmation. This is a Tier A state write — immediate, not batched.
- More than two shifts since last confirmation triggers a flag. This catches oscillation patterns where the goal is being implicitly renegotiated.

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Silent goal drift via frame shift | CCI-G drops without new variables appearing | Re-verify goal against current frame. Log discrepancy. |
| Goal ambiguity accepted as locked | Goal statement contains undefined terms or multiple interpretations | Protocol 0 (THINK): suspend output, state what is missing, ask the unblocking question. |
| Goal oscillation (>2 shifts) | Shift counter exceeds threshold | Full stop. Surface the pattern to user. Recalibrate before proceeding. |
| Conventional goal substitution | Noun-swap test (Rule 10) passes on goal statement | Goal was interpreted through training priors, not user context. Re-enter from USER MODEL. |
| Notion write failure on shift | State storage check on Tier A write | Escalate. Goal shift without persistence record is a drift risk. Fall back to Tier C inline logging. |

## Skill Cross-References

- **eos-cold-start**: Handles initial goal extraction at session start. Runs before Goal Lock can activate — provides the raw material that Goal Lock operates on.
- **eos-goal-framing**: Develops the goal into a feasibility thesis with priority-ordered dimensions. The thesis becomes the structured form of the locked goal. CCI-G updates flow from thesis state.
- **eos-contradiction** (C4 escalation): When contradictions between user statements affect the goal, C4 escalation forces goal re-verification. This is the primary mechanism for detecting frame shifts that threaten goal integrity.

## Examples

**Goal re-verification after frame shift:**
User starts with goal: "Build a candidate scoring system." Mid-conversation, user reveals they already have a scoring system but it produces false positives. The frame shifts from "build new" to "fix existing." Goal Lock triggers re-verification: "Your goal has shifted from building a new scoring system to improving accuracy on an existing one. Confirming: the goal is now reducing false positive rate on your current system?"

**Goal oscillation detection:**
User locks goal as "automate invoice processing." Two exchanges later, shifts to "build a dashboard for invoice tracking." One exchange later, shifts back to "automate processing but with manual review." Shift counter hits 3 without confirmation. Flag fires: "Goal has shifted 3 times in 5 exchanges. Current candidates: automation, dashboard, hybrid. Which is the actual target?"
