"""Hosted password authentication contract."""
from fastapi.testclient import TestClient

from hosting.app import create_app
from hosting.auth import AuthConfig, AuthService, hash_password


def service(password="correct horse battery staple", seconds=3600):
    return AuthService(
        AuthConfig(
            password_hash=hash_password(password),
            signing_secret="test-signing-secret-0123456789abcdef",
            session_seconds=seconds,
            cookie_secure=False,
        )
    )


def payload():
    return {
        "household": {"members": [{"id": "m1", "name": "Private Name"}], "tasks": []},
        "query": "Who should do what today?",
        "date": "2026-09-16",
        "locale": "en",
    }


def test_unauthenticated_session_is_reported_without_data():
    with TestClient(create_app(auth=service())) as client:
        response = client.get("/agent-api/auth/session")
        assert response.status_code == 200
        assert response.json() == {"authenticated": False, "auth_required": True}


def test_wrong_password_is_generic_and_does_not_set_cookie():
    with TestClient(create_app(auth=service())) as client:
        response = client.post("/agent-api/auth/login", json={"password": "wrong"})
        assert response.status_code == 401
        assert "wrong" not in response.text
        assert "set-cookie" not in response.headers


def test_correct_password_sets_secure_session_attributes_when_configured():
    auth = service()
    auth.config = AuthConfig(
        password_hash=auth.config.password_hash,
        signing_secret=auth.config.signing_secret,
        session_seconds=auth.config.session_seconds,
        cookie_secure=True,
    )
    with TestClient(create_app(auth=auth)) as client:
        response = client.post("/agent-api/auth/login", json={"password": "correct horse battery staple"})
        assert response.status_code == 200
        cookie = response.headers["set-cookie"].lower()
        assert "httponly" in cookie
        assert "samesite=lax" in cookie
        assert "secure" in cookie


def test_coach_is_protected_and_works_after_login():
    with TestClient(create_app(auth=service())) as client:
        denied = client.post("/agent-api/coach/ask", json=payload())
        assert denied.status_code == 401
        assert "Private Name" not in denied.text

        logged_in = client.post("/agent-api/auth/login", json={"password": "correct horse battery staple"})
        assert logged_in.status_code == 200
        allowed = client.post("/agent-api/coach/ask", json=payload())
        assert allowed.status_code == 200
        assert allowed.json()["plan"]["by_member"][0]["member_name"] == "Private Name"
        assert allowed.headers["cache-control"] == "no-store"


def test_logout_clears_session():
    with TestClient(create_app(auth=service())) as client:
        client.post("/agent-api/auth/login", json={"password": "correct horse battery staple"})
        assert client.post("/agent-api/coach/ask", json=payload()).status_code == 200
        logout = client.post("/agent-api/auth/logout")
        assert logout.status_code == 200
        assert client.post("/agent-api/coach/ask", json=payload()).status_code == 401


def test_expired_session_is_rejected():
    auth = service(seconds=300)
    token, _ = auth.issue_session(now=100)
    assert auth.verify_session(token, now=399) is not None
    assert auth.verify_session(token, now=400) is None


def test_incomplete_configuration_fails_closed():
    auth = AuthService(AuthConfig(password_hash=None, signing_secret=None))
    with TestClient(create_app(auth=auth)) as client:
        assert client.get("/agent-api/health").status_code == 200
        assert client.post("/agent-api/coach/ask", json=payload()).status_code == 503


def test_auth_disabled_is_explicit_for_existing_local_contracts():
    with TestClient(create_app(auth=AuthService.disabled())) as client:
        assert client.get("/agent-api/auth/session").json() == {
            "authenticated": True,
            "auth_required": False,
        }
        assert client.post("/agent-api/coach/ask", json=payload()).status_code == 200
