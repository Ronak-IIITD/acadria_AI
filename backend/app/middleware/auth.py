"""
Authentication middleware for Supabase JWT verification.
Supports both Supabase and Firebase (for migration).
"""

import os
import logging
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient, PyJWKClientError

from app.config import SUPABASE_URL, SUPABASE_ANON_KEY

logger = logging.getLogger(__name__)

# Security scheme - always requires auth
security = HTTPBearer(auto_error=True)
optional_security = HTTPBearer(auto_error=False)

# Supabase JWKS client (cached)
_supabase_jwks_client: Optional[PyJWKClient] = None


def _get_supabase_jwks() -> PyJWKClient:
    """Get or create Supabase JWKS client for token verification"""
    global _supabase_jwks_client

    if _supabase_jwks_client is None:
        if not SUPABASE_URL:
            raise ValueError("SUPABASE_URL not configured")

        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _supabase_jwks_client = PyJWKClient(jwks_url)

    return _supabase_jwks_client


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Verify Supabase JWT token and return decoded token.

    Args:
        credentials: HTTP Authorization credentials from request header

    Returns:
        dict: Decoded token containing user information

    Raises:
        HTTPException: If token is invalid or verification fails
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = credentials.credentials

    try:
        # Get the signing key from Supabase JWKS
        signing_key = _get_supabase_jwks().get_signing_key_from_jwt(token)

        # Decode and verify the token
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=["authenticated"],
            options={
                "verify_aud": True,
                "verify_exp": True,
                "verify_iss": True,
            },
            issuer=f"{SUPABASE_URL}/auth/v1",
        )

        logger.info(f"✅ Supabase token verified for user: {decoded.get('sub')}")
        return decoded

    except jwt.ExpiredSignatureError:
        logger.warning("⚠️ Expired Supabase token")
        raise HTTPException(status_code=401, detail="Authentication token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"⚠️ Invalid Supabase token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except PyJWKClientError as e:
        logger.error(f"❌ JWKS client error: {str(e)}")
        raise HTTPException(
            status_code=401, detail="Authentication service unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def verify_firebase_token_fallback(
    creds: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> dict:
    """
    Fallback: Verify Firebase ID token.
    This is for migration purposes - will be deprecated.
    """
    # Import here to avoid breaking if firebase-admin is not set up
    import firebase_admin
    from firebase_admin import credentials as fb_credentials, auth

    if not creds:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = creds.credentials

    try:
        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            if creds_path:
                cred = fb_credentials.Certificate(creds_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()

        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(token)
        logger.info(f"✅ Firebase token verified for user: {decoded_token.get('uid')}")
        return decoded_token

    except Exception as e:
        logger.error(f"❌ Firebase token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")


async def get_current_user(token_data: dict = Depends(verify_supabase_token)) -> dict:
    """
    Extract current user information from verified Supabase token.

    Args:
        token_data: Decoded token from verify_supabase_token

    Returns:
        dict: User information including uid, email, etc.
    """
    return {
        "uid": token_data.get("sub"),
        "email": token_data.get("email"),
        "name": token_data.get("user_metadata", {}).get("full_name"),
        "picture": token_data.get("user_metadata", {}).get("avatar_url"),
        "email_verified": token_data.get("email_confirmed_at") is not None,
    }


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(optional_security),
) -> Optional[dict]:
    """
    Optional authentication - returns user data if token provided, None otherwise.
    Useful for endpoints that work with or without authentication.

    Args:
        credentials: Optional HTTP Authorization credentials

    Returns:
        dict or None: User data if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        return await verify_supabase_token(credentials)
    except HTTPException:
        return None


def is_supabase_configured() -> bool:
    """Check if Supabase is properly configured"""
    return bool(SUPABASE_URL and SUPABASE_ANON_KEY)
