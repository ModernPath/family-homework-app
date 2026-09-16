"""Small, stateless password authentication for the hosted family app.

The first provider is one shared family password.  The public surface uses a
provider-neutral principal so a later user/identity provider can replace the
password verifier without coupling auth to household or coach logic.
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass
from typing import Any, Mapping


HASH_ALGORITHM = "scrypt"
HASH_N = 32_768
HASH_R = 8
HASH_P = 1
HASH_LENGTH = 32
HASH_MAXMEM = 64 * 1024 * 1024
DEFAULT_SESSION_SECONDS = 7 * 24 * 60 * 60


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    """Return a portable scrypt password hash for deployment configuration."""
    if not password:
        raise ValueError("Password must not be empty")
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=HASH_N,
        r=HASH_R,
        p=HASH_P,
        dklen=HASH_LENGTH,
        maxmem=HASH_MAXMEM,
    )
    return "$".join(
        [
            HASH_ALGORITHM,
            str(HASH_N),
            str(HASH_R),
            str(HASH_P),
            _b64encode(salt),
            _b64encode(digest),
        ]
    )


def verify_password(password: str, encoded_hash: str | None) -> bool:
    """Verify a password without exposing malformed configuration details."""
    if not password or not encoded_hash:
        return False
    try:
        algorithm, n_raw, r_raw, p_raw, salt_raw, digest_raw = encoded_hash.split("$", 5)
        if algorithm != HASH_ALGORITHM:
            return False
        n, r, p = int(n_raw), int(r_raw), int(p_raw)
        salt = _b64decode(salt_raw)
        expected = _b64decode(digest_raw)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=n,
            r=r,
            p=p,
            dklen=len(expected),
            maxmem=HASH_MAXMEM,
        )
        return hmac.compare_digest(actual, expected)
    except (binascii.Error, TypeError, ValueError, IndexError):
        return False


@dataclass(frozen=True)
class AuthPrincipal:
    """Provider-neutral identity carried by a valid session."""

    subject: str
    tenant_id: str
    roles: tuple[str, ...]
    issued_at: int
    expires_at: int


@dataclass(frozen=True)
class AuthConfig:
    password_hash: str | None
    signing_secret: str | None
    session_seconds: int = DEFAULT_SESSION_SECONDS
    cookie_name: str = "family_session"
    cookie_secure: bool = True
    enabled: bool = True

    @classmethod
    def from_environment(cls) -> "AuthConfig":
        raw_seconds = os.environ.get("FAMILY_AUTH_SESSION_SECONDS", "")
        try:
            session_seconds = int(raw_seconds) if raw_seconds else DEFAULT_SESSION_SECONDS
        except ValueError:
            session_seconds = DEFAULT_SESSION_SECONDS
        session_seconds = max(300, min(session_seconds, 30 * 24 * 60 * 60))
        secure_raw = os.environ.get("FAMILY_AUTH_COOKIE_SECURE", "true").lower()
        cookie_secure = secure_raw not in {"0", "false", "no", "off"}
        return cls(
            password_hash=os.environ.get("FAMILY_APP_PASSWORD_HASH"),
            signing_secret=os.environ.get("FAMILY_AUTH_SECRET"),
            session_seconds=session_seconds,
            cookie_secure=cookie_secure,
        )


class AuthService:
    """Password verifier and signed-session service."""

    def __init__(self, config: AuthConfig):
        self.config = config

    @classmethod
    def from_environment(cls) -> "AuthService":
        return cls(AuthConfig.from_environment())

    @classmethod
    def disabled(cls) -> "AuthService":
        """Explicit test/development bypass; never selected implicitly in production."""
        return cls(AuthConfig(None, None, enabled=False))

    @property
    def configured(self) -> bool:
        return (
            self.config.enabled
            and bool(self.config.password_hash)
            and bool(self.config.signing_secret)
            and len(self.config.signing_secret.encode("utf-8")) >= 32
        )

    def verify_password(self, password: str) -> bool:
        return self.configured and verify_password(password, self.config.password_hash)

    def _signing_key(self) -> bytes:
        if not self.config.signing_secret:
            raise RuntimeError("Authentication is not configured")
        return self.config.signing_secret.encode("utf-8")

    def issue_session(self, now: int | None = None) -> tuple[str, AuthPrincipal]:
        if not self.configured:
            raise RuntimeError("Authentication is not configured")
        issued_at = int(time.time() if now is None else now)
        principal = AuthPrincipal(
            subject="family",
            tenant_id="family",
            roles=("member",),
            issued_at=issued_at,
            expires_at=issued_at + self.config.session_seconds,
        )
        claims = {
            "v": 1,
            "sub": principal.subject,
            "tenant": principal.tenant_id,
            "roles": list(principal.roles),
            "iat": principal.issued_at,
            "exp": principal.expires_at,
        }
        encoded = _b64encode(json.dumps(claims, separators=(",", ":")).encode("utf-8"))
        signature = hmac.new(self._signing_key(), encoded.encode("ascii"), hashlib.sha256).digest()
        return f"{encoded}.{_b64encode(signature)}", principal

    def verify_session(self, token: str | None, now: int | None = None) -> AuthPrincipal | None:
        if not self.configured or not token or "." not in token:
            return None
        encoded, signature_raw = token.split(".", 1)
        try:
            supplied_signature = _b64decode(signature_raw)
            expected_signature = hmac.new(
                self._signing_key(), encoded.encode("ascii"), hashlib.sha256
            ).digest()
            if not hmac.compare_digest(supplied_signature, expected_signature):
                return None
            claims: Mapping[str, Any] = json.loads(_b64decode(encoded).decode("utf-8"))
            issued_at = int(claims["iat"])
            expires_at = int(claims["exp"])
            current = int(time.time() if now is None else now)
            if claims.get("v") != 1 or expires_at <= current or issued_at > current + 60:
                return None
            roles = claims.get("roles")
            if not isinstance(roles, list) or not all(isinstance(role, str) for role in roles):
                return None
            subject = claims.get("sub")
            tenant_id = claims.get("tenant")
            if not isinstance(subject, str) or not isinstance(tenant_id, str):
                return None
            return AuthPrincipal(subject, tenant_id, tuple(roles), issued_at, expires_at)
        except (
            binascii.Error,
            TypeError,
            ValueError,
            KeyError,
            UnicodeDecodeError,
            json.JSONDecodeError,
        ):
            return None

    def principal_from_cookie(self, token: str | None) -> AuthPrincipal | None:
        if not self.configured:
            return None
        return self.verify_session(token)
