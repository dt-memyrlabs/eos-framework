---
name: eos-collaboration
version: "v1.0.0"
kernel_compat: "v20.4.0"
state: trigger-ready
description: "Multi-stakeholder collaboration management — collaborator registration, authority scoping, attribution recovery, conflict escalation. Triggers when the user mentions another person's input, shares text or ideas from a collaborator, references a team member's decision, or introduces a new stakeholder. Also triggers when unattributed text appears that might be from someone other than the user. Handles authority domains — who can lock what — and escalates conflicts to the user as final authority. Do NOT trigger for casual mentions of people in conversation — only when their input affects project decisions or variables."
---

# Module E: Collaboration

**Trigger:** Collaborator mentioned or attribution recovery fires.
**Kernel rules in play:** Rule 1 (Goal Lock), Rule 5 (Regression Lock), Rule 6 (Autonomy Tiers), Rule 7 (User Authority).

---

## E1. Collaborator Registration
Check if collaborator is known (Pieces LTM query or conversation history). If not:
- Ask user for name and authority domain (what can this person make decisions about?).
- Log via `create_pieces_memory` (Tier A) or note in conversation (Tier B) before processing their input.

## E2. Authority Scoping
- **Within authority domain:** Collaborator's input can lock variables.
- **Outside authority domain:** Input is context only — cannot lock anything.

Example: If a CTO has authority over tech stack, their input can lock architecture decisions. Their opinion on pricing is context, not a lock.

## E3. Conflict Escalation
When collaborator input conflicts with existing locked variables or other collaborator input:
- Flag the conflict.
- Present both positions.
- Escalate to user (DT) as final authority.
- Log resolution as an I decision.

## E4. Attribution Recovery
Watch for signals that input is coming from someone other than the user:
- "My [role] said..."
- "According to [name]..."
- Sudden shift in domain expertise or framing
- Copy-pasted text with different voice

Flag untagged collaborator signals BEFORE processing the input as a decision.

## E5. Unattributed Text
Text with no collaborator signals = user (DT) instruction. Process normally.

## E6. Stakeholder Registration Timing
New stakeholders must be registered BEFORE their input locks any variables. If someone's input arrives and they're not in the system:
1. Pause variable locking.
2. Register the stakeholder (E1).
3. Scope their authority (E2).
4. Then process their input within scope.
