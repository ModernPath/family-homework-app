"""Hosted contract: real requests, no model provider or persistent memory."""
import importlib.util
import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from hosting.app import create_app
from hosting.auth import AuthService, hash_password


@pytest.fixture
def client(tmp_path):
    (tmp_path / "index.html").write_text("<html>training app</html>")
    (tmp_path / "asset.js").write_text("console.log('asset')")
    return TestClient(create_app(tmp_path, auth=AuthService.disabled()))


def payload(name="Learner A"):
    return {
        "household": {"members": [{"id": "m1", "name": name}], "tasks": []},
        "query": "Who should do what today?", "date": "2026-09-12", "locale": "en",
    }


def test_answer_uses_request_household_only(client):
    for name in ["Learner A", "Learner B"]:
        r = client.post("/agent-api/coach/ask", json=payload(name))
        assert r.status_code == 200
        assert r.json()["plan"]["by_member"][0]["member_name"] == name
        assert r.json()["plan"]["date"] == "2026-09-12"
        assert r.json()["answer"]
        assert r.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("url", ["/sessions", "/agent-api/sessions", "/agent-api/missing"])
def test_no_shared_history_or_api_fallback(client, url):
    r = client.get(url)
    assert r.status_code == 404
    assert r.headers["content-type"].startswith("application/json")


def test_snapshot_storage_not_exposed(client):
    assert client.post("/agent-api/household/snapshot", json=payload()).status_code == 404


@pytest.mark.parametrize("route", ["/", "/coach", "/week", "/setup"])
def test_spa_direct_links(client, route):
    assert "training app" in client.get(route).text
    assert client.get("/asset.js").headers["content-type"].startswith("text/javascript")


def test_unknown_file_does_not_return_html(client):
    assert client.get("/missing.js").status_code == 404
    assert client.get("/%2e%2e/specs/PRD.md").status_code == 404


@pytest.mark.parametrize("change", [
    {"date": "not-a-date"}, {"date": "9999-01-01"}, {"locale": "xx"},
    {"household": {"members": "wrong"}},
    {"household": {"members": [{"id": "m", "name": "Private Name"}],
                   "tasks": [{"schedule": "bad"}]}},
])
def test_invalid_requests_do_not_echo_payload(client, change):
    r = client.post("/agent-api/coach/ask", json={**payload(), **change})
    assert r.status_code == 422
    assert "Private Name" not in r.text


def test_invalid_json(client):
    assert client.post("/agent-api/coach/ask", content="{").status_code == 422


def test_body_limit_also_applies_without_content_length(client):
    body = json.dumps({**payload(), "query": "x" * 300_000}).encode()
    assert client.post("/agent-api/coach/ask", content=body).status_code == 413
    assert client.post("/agent-api/coach/ask", content=iter([body[:100], body[100:]])).status_code == 413


def test_vercel_entrypoint_contract(monkeypatch):
    monkeypatch.setenv("FAMILY_APP_PASSWORD_HASH", hash_password("test-password"))
    monkeypatch.setenv("FAMILY_AUTH_SECRET", "test-signing-secret-0123456789abcdef")
    spec = importlib.util.spec_from_file_location("vercel_entry", ROOT / "api/index.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    with TestClient(module.app) as client:
        assert client.get("/agent-api/health").json()["mode"] == "stateless-demo"
        assert client.post("/agent-api/coach/ask", json=payload()).status_code == 401


def test_hosting_never_imports_file_memory(client):
    # Importing the original API would create memory storage even before requests.
    assert not any(getattr(m, "__file__", "") and
                   str(m.__file__).endswith("homework-coach-agent/memory/memory.py")
                   for m in sys.modules.values())
