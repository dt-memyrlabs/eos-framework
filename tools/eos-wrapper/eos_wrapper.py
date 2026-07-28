"""Experimental local chat wrapper around the Anthropic API.

This is a minimal example harness that layers the Lock & Prune
StateManager on top of a normal Claude chat loop. It is NOT part of
the EOS kernel and has not been validated by the project's
falsification harness (tools/eos-test.md). Treat it as a draft.

Usage:
    pip install -r requirements.txt
    cp .env.example .env  # then add your own ANTHROPIC_API_KEY
    python eos_wrapper.py
"""

import os
import re
import sys

import anthropic
from dotenv import load_dotenv
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from state_manager import StateManager

load_dotenv()

console = Console()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("MODEL_NAME", "claude-sonnet-4-5")

state = StateManager()

DEFAULT_USER_MODEL = "Describe yourself here: who you are, what you're working on, and how you like to work."


def parse_lock_commands(response: str):
    decision_match = re.search(
        r"LOCK DECISION:\s*(.+?)\s*because\s*(.+?)(?=\n\n|\nLOCK|\Z)",
        response,
        re.IGNORECASE | re.DOTALL,
    )
    if decision_match:
        state.add_decision(decision_match.group(1).strip(), decision_match.group(2).strip())
        console.print("[green]Decision locked.[/green]")

    verify_match = re.search(r"VERIFY PREDICTION\s+(\d+):\s*(\w+)", response, re.IGNORECASE)
    if verify_match:
        state.verify_prediction(int(verify_match.group(1)), verify_match.group(2))
        console.print("[green]Prediction verified.[/green]")


def chat_loop():
    console.print(
        Panel.fit(
            "[bold blue]Lock & Prune wrapper[/bold blue]\n"
            "Type 'quit' to exit, 'set model <text>' to update the user model."
        )
    )

    user_model = DEFAULT_USER_MODEL

    while True:
        try:
            user_input = console.input("\n[bold green]You:[/bold green] ")
        except (EOFError, KeyboardInterrupt):
            break

        if user_input.strip().lower() in ("quit", "exit"):
            break

        if user_input.lower().startswith("set model"):
            user_model = user_input[len("set model"):].strip()
            console.print("[yellow]User model updated.[/yellow]")
            continue

        system_prompt = state.get_system_prompt(user_model)

        with console.status("[bold blue]Thinking...[/bold blue]"):
            message = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_input}],
            )

        response_text = message.content[0].text
        parse_lock_commands(response_text)

        state.log_turn("user", user_input, {})
        state.log_turn("assistant", response_text, {})

        console.print(Markdown(response_text))


if __name__ == "__main__":
    if not os.getenv("ANTHROPIC_API_KEY"):
        console.print("[red]Error: ANTHROPIC_API_KEY not set. Copy .env.example to .env and fill it in.[/red]")
        sys.exit(1)
    chat_loop()
