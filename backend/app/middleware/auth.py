"""
Authentication middleware for Clerk JWT verification.
"""

import logging
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from app.config import CLERK_JWT_ISSUER, CLERK_JWT_AUDIENCE, CLERK_JWT_SECRET

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=True)
optional_security = HTTPBearer(auto_error=False)


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Verify Clerk JWT token and return decoded token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = credentials.credentials
    try:
        if not CLERK_JWT_SECRET or not CLERK_JWT_ISSUER or not CLERK_JWT_AUDIENCE:
            raise HTTPException(status_code=500, detail="Clerk JWT config missing")

        decoded = jwt.decode(
            token,
            CLERK_JWT_SECRET,
            algorithms=["HS256"],
            audience=CLERK_JWT_AUDIENCE,
            issuer=CLERK_JWT_ISSUER,
            options={"verify_aud": True, "verify_iss": True},
        )
        logger.info(f"✅ Clerk token verified for user: {decoded.get('sub')}")
        return decoded
    except jwt.ExpiredSignatureError:
        logger.warning("⚠️ Expired Clerk token")
        raise HTTPException(status_code=401, detail="Authentication token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"⚠️ Invalid Clerk token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error(f"❌ Token verification failed: {str(e)}")
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
