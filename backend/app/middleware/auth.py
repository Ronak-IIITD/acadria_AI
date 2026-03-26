"""Authentication middleware for Clerk JWT verification."""

import logging
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import CLERK_JWT_AUDIENCE, CLERK_JWT_ISSUER, CLERK_JWT_SECRET

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=True)
optional_security = HTTPBearer(auto_error=False)

_jwks_client: Optional[jwt.PyJWKClient] = None


def _get_jwks_client() -> jwt.PyJWKClient:
    """Create/cache Clerk JWKS client for RS256 token verification."""
    global _jwks_client
    if _jwks_client is None:
        if not CLERK_JWT_ISSUER:
            raise HTTPException(
                status_code=500,
                detail="CLERK_JWT_ISSUER is required for Clerk JWKS verification",
            )

        issuer = CLERK_JWT_ISSUER.rstrip("/")
        _jwks_client = jwt.PyJWKClient(f"{issuer}/.well-known/jwks.json")
    return _jwks_client


def _decode_hs256(token: str) -> dict:
    """Decode HS256 token (Clerk JWT template flow)."""
    if not CLERK_JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="CLERK_JWT_SECRET is required for HS256 Clerk JWT verification",
        )

    return jwt.decode(
        token,
        CLERK_JWT_SECRET,
        algorithms=["HS256"],
        audience=CLERK_JWT_AUDIENCE or None,
        issuer=CLERK_JWT_ISSUER or None,
        options={
            "verify_aud": bool(CLERK_JWT_AUDIENCE),
            "verify_iss": bool(CLERK_JWT_ISSUER),
        },
    )


def _decode_rs256(token: str) -> dict:
    """Decode RS256 token using Clerk JWKS (session token flow)."""
    jwks_client = _get_jwks_client()
    signing_key = jwks_client.get_signing_key_from_jwt(token)

    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=CLERK_JWT_AUDIENCE or None,
        issuer=CLERK_JWT_ISSUER or None,
        options={
            "verify_aud": bool(CLERK_JWT_AUDIENCE),
            "verify_iss": bool(CLERK_JWT_ISSUER),
        },
    )


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Verify Clerk JWT token and return decoded token claims."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        algorithm = (header.get("alg") or "").upper()

        if algorithm == "HS256":
            decoded = _decode_hs256(token)
        elif algorithm == "RS256":
            decoded = _decode_rs256(token)
        else:
            # Compatibility fallback: try HS256 first, then RS256.
            try:
                decoded = _decode_hs256(token)
            except Exception:
                decoded = _decode_rs256(token)

        logger.info("✅ Clerk token verified for user: %s", decoded.get("sub"))
        return decoded

    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        logger.warning("⚠️ Expired Clerk token")
        raise HTTPException(status_code=401, detail="Authentication token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning("⚠️ Invalid Clerk token: %s", str(e))
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error("❌ Token verification failed: %s", str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_current_user(token_data: dict = Depends(verify_clerk_token)) -> dict:
    """Extract current user information from verified Clerk token."""
    return {
        "uid": token_data.get("sub"),
        "email": token_data.get("email"),
        "name": token_data.get("name"),
        "picture": token_data.get("picture"),
        "email_verified": token_data.get("email_verified", False),
    }


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(optional_security),
) -> Optional[dict]:
    if not credentials:
        return None

    try:
        return await verify_clerk_token(credentials)
    except HTTPException:
        return None
