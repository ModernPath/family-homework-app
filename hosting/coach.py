"""Hosted coach: deterministic facts plus optional Gemini narration."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
AGENT_DIR = ROOT / "agents/homework-coach-agent"
sys.path.insert(0, str(AGENT_DIR))

from homework_core import answer_query  # noqa: E402
from narrator import gemini_configured, narrate_with_gemini  # noqa: E402


def coach_answer(
    household: dict[str, Any],
    query: str,
    *,
    date: str,
    locale: str,
) -> dict[str, Any]:
    result = answer_query(household, query, date=date, locale=locale)
    narration = "template"
    if gemini_configured():
        facts = {
            "intent": result.get("intent"),
            "plan": result.get("plan"),
            "week_plan": result.get("week_plan"),
            "contributions": result.get("contributions"),
        }
        result["answer"] = narrate_with_gemini(
            query,
            facts,
            locale,
            result["answer"],
        )
        narration = "gemini"
    result["narration"] = narration
    return result
