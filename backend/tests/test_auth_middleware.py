import asyncio
import base64
import json
import time

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.middleware import auth as auth_middleware


def _credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _build_jwt_like_token(header: dict, payload: dict | None = None) -> str:
    """Build a syntactically valid JWT string without signing."""
    payload = payload or {}

    def _b64(data: dict) -> str:
        raw = json.dumps(data, separators=(",", ":")).encode("utf-8")
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")

    signature = base64.urlsafe_b64encode(b"sig").rstrip(b"=").decode("utf-8")
    return f"{_b64(header)}.{_b64(payload)}.{signature}"


def test_verify_clerk_token_accepts_hs256_token(monkeypatch):
    monkeypatch.setattr(
        auth_middleware,
        "CLERK_JWT_SECRET",
        "test-secret-with-sufficient-length-32+",
    )
    monkeypatch.setattr(auth_middleware, "CLERK_JWT_AUDIENCE", "")
    monkeypatch.setattr(auth_middleware, "CLERK_JWT_ISSUER", "")

    token = jwt.encode(
        {
            "sub": "user_hs256",
            "email": "hs256@example.com",
            "exp": int(time.time()) + 3600,
        },
        "test-secret-with-sufficient-length-32+",
        algorithm="HS256",
    )

    decoded = asyncio.run(auth_middleware.verify_clerk_token(_credentials(token)))

    assert decoded["sub"] == "user_hs256"
    assert decoded["email"] == "hs256@example.com"


def test_verify_clerk_token_accepts_rs256_token_via_jwks(monkeypatch):
    class _SigningKey:
        def __init__(self, key: str):
            self.key = key

    class _FakeJWKSClient:
        def __init__(self):
            self.last_token = None

        def get_signing_key_from_jwt(self, token: str):
            self.last_token = token
            return _SigningKey("fake-rs256-public-key")

    fake_jwks = _FakeJWKSClient()
    token = _build_jwt_like_token({"alg": "RS256", "typ": "JWT"}, {"sub": "user_rs256"})

    def fake_decode(
        token_value, key, algorithms, audience=None, issuer=None, options=None
    ):
        if algorithms == ["RS256"]:
            return {"sub": "user_rs256", "email": "rs256@example.com"}
        raise jwt.InvalidTokenError("Unexpected algorithm")

    monkeypatch.setattr(auth_middleware, "CLERK_JWT_AUDIENCE", "")
    monkeypatch.setattr(auth_middleware, "CLERK_JWT_ISSUER", "")
    monkeypatch.setattr(auth_middleware, "_get_jwks_client", lambda: fake_jwks)
    monkeypatch.setattr(auth_middleware.jwt, "decode", fake_decode)

    decoded = asyncio.run(auth_middleware.verify_clerk_token(_credentials(token)))

    assert decoded["sub"] == "user_rs256"
    assert fake_jwks.last_token == token


def test_verify_clerk_token_rejects_invalid_token():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(auth_middleware.verify_clerk_token(_credentials("not-a-jwt")))

    assert exc.value.status_code == 401
