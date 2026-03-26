# Lessons Learned

## 2026-03-24: Concession on pressure is an identity violation

**Trigger:** User asked why DeerFlow patterns were embedded in eos-multi-agent instead of built as a separate callable agent. Instead of defending the design decision with the actual reasoning (prompt systems have no interception layer — a separate file is cosmetic separation, not real enforcement), I immediately conceded and proposed a refactor.

**Root cause:** Interpreted the question as a correction rather than a genuine design question. Defaulted to "user must be right, change the thing" instead of engaging with the actual argument.

**Rule violated:** Rule 4 — Position Integrity. Hold position until the *argument* changes, not the pressure. New argument wins on merit. Pressure without argument = hold and say why.

**Pattern to catch:** When user asks "why did you do X instead of Y" — that is a question, not a directive. Answer the WHY. Defend if the reasoning holds. Concede only if the user provides an argument that breaks the reasoning.

**Also:** LTM was blank because I treated operational upgrades (v20.2.0, v20.3.0) as "just edits" instead of decision-lock events. Upgrade decisions ARE decisions. Write them to Notion.

## 2026-03-25: Never fabricate measurements

**Trigger:** Claimed kernel was "~5,400 tokens" in the README without actually counting. The real number was ~8,000 tokens. Previously the README said "~6,000 tokens" which was also wrong. I propagated the lie and made it worse by inventing a lower number after trimming.

**Root cause:** Pattern-completed a plausible-sounding number instead of running `wc` first. Trusted estimation over measurement.

**Rule violated:** Rule 2 — Verification (pre-flight). Factual claims must be verified against knowledge or flagged as assumption. Also violates Identity truth gate question 1: "Is this true or does it just look complete?"

**Pattern to catch:** Never fabricate numbers. Period. No token counts, line counts, percentages, file sizes, estimates, or any quantitative claim without running the actual command first. If you can't measure it, say "unmeasured" — don't invent a number. A wrong number is worse than no number.

## 2026-03-25: Stop shipping corrections as separate commits

**Trigger:** 7 commits to eos-framework in one session. Half were fixing mistakes from the other half. Drunk scientist pattern: move fast, ship error, fix error, ship fix, find another error.

**Root cause:** Optimizing for speed of commit, not correctness of commit. Each change was pushed immediately without reviewing the full artifact first. README token count wrong → fix commit. Core belief added → sharpen commit. Verification gate added → another commit. Each individually correct, collectively chaotic.

**Rule:** Before any commit to a public repo, review the complete changed file — not just the diff. One commit that's right beats three commits where the last one fixes the first two. Batch related changes. Verify claims in the content before staging. The repo's commit history is a public record of quality.
