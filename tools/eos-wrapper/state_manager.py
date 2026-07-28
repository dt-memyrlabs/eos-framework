import json
import os
from datetime import datetime
from typing import Dict, Any


class StateManager:
    """Minimal 'Lock & Prune' persistence layer.

    Stores a small set of locked decisions/constraints/facts plus a
    prediction ledger in local JSON files, and keeps a bounded rolling
    session history. This is experimental, hand-written glue code, not
    a validated part of the EOS kernel.
    """

    def __init__(self, state_dir: str = "eos_state"):
        self.state_dir = state_dir
        os.makedirs(state_dir, exist_ok=True)

        self.locked_file = os.path.join(state_dir, "locked_context.json")
        self.prediction_file = os.path.join(state_dir, "predictions.json")
        self.session_log = os.path.join(state_dir, "session_log.json")

        self.locked_context = self._load_json(
            self.locked_file, {"decisions": [], "constraints": [], "facts": []}
        )
        self.predictions = self._load_json(self.prediction_file, [])
        self.session_history = self._load_json(self.session_log, [])

    def _load_json(self, path: str, default: Any) -> Any:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception:
                return default
        return default

    def _save_json(self, path: str, data: Any):
        with open(path, "w") as f:
            json.dump(data, f, indent=2)

    def add_decision(self, decision: str, rationale: str):
        entry = {
            "id": len(self.locked_context["decisions"]) + 1,
            "text": decision,
            "rationale": rationale,
            "timestamp": datetime.now().isoformat(),
        }
        self.locked_context["decisions"].append(entry)
        self._save_json(self.locked_file, self.locked_context)
        return entry["id"]

    def add_constraint(self, constraint: str):
        self.locked_context["constraints"].append(constraint)
        self._save_json(self.locked_file, self.locked_context)

    def add_fact(self, fact: str):
        if fact not in self.locked_context["facts"]:
            self.locked_context["facts"].append(fact)
            self._save_json(self.locked_file, self.locked_context)

    def add_prediction(self, claim: str, verification_method: str):
        pred = {
            "id": len(self.predictions) + 1,
            "claim": claim,
            "method": verification_method,
            "status": "pending",
            "created": datetime.now().isoformat(),
        }
        self.predictions.append(pred)
        self._save_json(self.prediction_file, self.predictions)
        return pred["id"]

    def verify_prediction(self, pred_id: int, status: str, result: str = ""):
        for p in self.predictions:
            if p["id"] == pred_id:
                p["status"] = status
                p["result"] = result
                p["verified_at"] = datetime.now().isoformat()
                break
        self._save_json(self.prediction_file, self.predictions)

    def log_turn(self, role: str, content: str, monitors: Dict):
        self.session_history.append(
            {
                "timestamp": datetime.now().isoformat(),
                "role": role,
                "content": content,
                "monitors": monitors,
            }
        )
        if len(self.session_history) > 50:
            self.session_history = self.session_history[-50:]
        self._save_json(self.session_log, self.session_history)

    def get_system_prompt(self, user_model: str) -> str:
        decisions_text = "\n".join(
            f"- {d['text']} (Rationale: {d['rationale']})" for d in self.locked_context["decisions"]
        )
        constraints_text = "\n".join(f"- {c}" for c in self.locked_context["constraints"])
        facts_text = "\n".join(f"- {f}" for f in self.locked_context["facts"])

        pending_preds = [p for p in self.predictions if p["status"] == "pending"]
        preds_text = "\n".join(f"- ID {p['id']}: {p['claim']}" for p in pending_preds)

        return f"""# Lock & Prune Context

## Locked Decisions
{decisions_text or "- None yet"}

## Constraints
{constraints_text or "- None yet"}

## Verified Facts
{facts_text or "- None yet"}

## Pending Predictions
{preds_text or "- None pending"}

## User Model
{user_model}

## Instructions
- Treat the locked context above as ground truth for this session.
- To record a new decision, say: LOCK DECISION: <decision> because <rationale>
- To resolve a prediction, say: VERIFY PREDICTION <id>: <status>
"""
