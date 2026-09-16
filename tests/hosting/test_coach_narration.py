"""Coach narration: template fallback and optional Gemini routing."""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from hosting.app import create_app
from hosting.auth import AuthService


@pytest.fixture
def client(tmp_path):
    (tmp_path / "index.html").write_text("<html>training app</html>")
    return TestClient(create_app(tmp_path, auth=AuthService.disabled()))


def payload(query="does this work?"):
    return {
        "household": {
            "members": [{"id": "m1", "name": "Minna"}],
            "tasks": [{"id": "t1", "title": "Dishes", "icon": "🍽️",
                       "schedule": {"kind": "daily"}, "assignment": {"kind": "rotation"}}],
        },
        "query": query,
        "date": "2026-09-16",
        "locale": "en",
    }


def test_health_reports_template_without_gemini(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_AI_STUDIO_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    assert client.get("/agent-api/health").json()["coach_narration"] == "template"


def test_health_reports_gemini_when_key_set(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    assert client.get("/agent-api/health").json()["coach_narration"] == "gemini"


def test_ask_uses_gemini_narration_when_configured(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    def fake_narrate(query, facts, locale, template):
        assert query == "does this work?"
        assert facts["plan"]["date"] == "2026-09-16"
        return "Yes, the coach API is working with your LLM."

    monkeypatch.setattr("hosting.coach.narrate_with_gemini", fake_narrate)
    result = client.post("/agent-api/coach/ask", json=payload()).json()
    assert result["narration"] == "gemini"
    assert result["answer"] == "Yes, the coach API is working with your LLM."


def test_ask_keeps_template_without_gemini(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_AI_STUDIO_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    result = client.post("/agent-api/coach/ask", json=payload()).json()
    assert result["narration"] == "template"
    assert "Here's who should do what" in result["answer"]
