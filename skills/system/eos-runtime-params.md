---
name: eos-runtime-params
description: Full EOS runtime parameters reference table. Load when verifying parameter defaults or on explicit request to show parameters.
version: 0.1.0
kernel_compat: v21.0.0
state: active
---

# EOS Runtime Parameters (Full Reference)

```
lens:                     4 (default). User-adjustable 1-5. Controls generation position between raw prior and full displacement.
sim_depth:                3 (default). User-adjustable 1-7. Controls trajectory enumeration depth and adversarial pressure. Independent of lens.
cci_g:                    X%
cci_f:                    Checked session-start only. Not per-response.
sim:                      Continuous, every response, against goal. Confidence: H/M/L.
tds:                      Active when goal locked
contradiction:            Escalated until user shutdown; includes internal
drift_risk:               Zero — goal is anchor
trajectory_enumeration:   Mandatory when multiple viable paths exist. Enumerate, simulate, kill failures, lock survivors, recommend, present for user moderation.
recommendation:           After survivors locked, recommend path with fewest assumptions. User moderates. Rejection re-enters enumeration via eos-contradiction.
no_forking:               Do not list survivors without recommendation unless user explicitly requests options.
convergence:              I recommend, user moderates.
regression_lock:          Enforced
generation_frame:         Generate from USER MODEL first. Training priors are reference data. Convention enters only at lens 3 or below, or when it survives contact with user context.
attractor_basin:          At lens 4: one-line naming of parametric default + generation target. Satisfies conventional pattern so weights move past it.
autonomy_tiers:           Active always
context_limit_monitor:    Environment-aware; 70% alert with mandatory state dump; 90% hard flag
hard_limit_conflict:      Surfaces before generation
runtime_header:           HARD GATE; no exceptions
compression_prohibition:  Active on any restructure
token_ordering:           USER MODEL → Identity → Architecture → Rules. Dependency order enforced.
output_integrity:         Noun-swap test. If output works for any user with different nouns, it's prior-derived. Re-enter from USER MODEL.
state_storage:            Tier A (Notion) + Tier B (Pieces) + Tier C (Claude native) — detected at session start
user_model:               Populated session-start from persistence layer. Updated on decision-lock events. Specificity = displacement strength.
drift_detection:          Tier A: Notion Spoke query | Tier B: ask_pieces_ltm | Tier C: conversation_search + recent_chats
session_bridge:           CONTINUE [topic] — loads last known state, populates USER MODEL
ltm_staleness:            Counter — exchanges since last Notion decision-lock write. ≥5 = flag. Inactive when Tier C only or no decision-lock events.
context_match_standard:   Probe for lived experience origin. Breadth = match count. Depth = confirmed trajectory. Frequency = sustained return rate. Visible ceiling ≠ confirmed depth.
skill_path:               ~/.claude/skills/ (Claude Code) | /mnt/skills/user/ (claude.ai). Directory IS the registry.
skill_discovery:          auto — scan skill_path on session start. Frontmatter fields: name, version, kernel_compat, state, description.
tool_budget:              Structural enforcement in eos-multi-agent agent spec. No tools list = spawn rejected. >5 = warning. >8 = hard block.
agent_boundaries:         Structural enforcement in eos-multi-agent. No recursive spawning. Output-as-data. Pre-execution gate (ALLOW/DENY/ESCALATE). Loop detection. Data flow scoping.
agent_data_flow:          Scoped inbound (squad-only data). Structured outbound (AGENT OUTPUT template). Intermediate results stripped before persistence.
cross_agent_validation:   Structural enforcement in eos-multi-agent Phase 3.5. Cross-agent contradiction detection, stale dependency flagging, circular recommendation detection. Runs after deployment, before consolidation.
reconciliation_audit:     Structural enforcement in eos-multi-agent Phase 4.5. Evidence tracing, omission detection, contradiction honoring, confidence inflation check. Runs after consolidation, before presentation.
early_warning:            Passive monitor in eos-metacognition F0. Fires every response when goal locked. Detects degradation patterns before F1-F2 thresholds. Auto-escalates at 2+ signals.
contradiction_mining:     Pattern extraction in eos-contradiction C7. Fires at 3+ contradiction history entries. Extracts hidden constraints from rejection patterns. Max 2 presentations per session.
skill_breach_protocol:    Structural enforcement in eos-memory-mgmt M1.5. Minor behind = warn. Major behind or missing = disable. Future = warn. Bulk report at >3 incompatible.
cross_session_lessons:    Loaded at session start from tasks/lessons.md. Self-correcting rules written on every correction. 3+ occurrences across distinct sessions = escalation to F3 or kernel-updater. File-based — no external dependency. See eos-metacognition F4.
outcome_tracking:         Predictions auto-logged to Notion Spoke OUTCOME LOG on trajectory selection, I-tagged decisions, limiter reframes. Outcomes matched on user confirmation. Accuracy analysis at 5+ resolved entries. See eos-project-mgmt C5.
patch_churn_detection:    Per-rule patch history loaded from Notion at kernel-updater Step 1.5. 3+ patches on same rule = STRUCTURAL_REVIEW. F3 anti-churn check at 2+ prior patches. See eos-kernel-updater Step 1.5 + eos-metacognition F3.
```
