"""
Admin authentication system for privileged access.
Replaces DEV_MODE with secure admin credentials.
"""

import os
from typing import Optional
from fastapi import HTTPException, Security, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth
import logging
from datetime import datetime, timedelta
import secrets

logger = logging.getLogger(__name__)

# ADMIN CREDENTIALS (Hardcoded for you and contributors)
# ⚠️ Keep these secure and rotate periodically
ADMIN_EMAIL = "itadoriyuji8875@gmail.com"
ADMIN_PASSWORD = "yuji@itadori19"

# Admin session management (in-memory, reset on server restart)
admin_sessions = {}  # session_token: {email, created_at, last_used}


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminAuth:
    """
    Admin authentication handler.
    Provides admin access with full privileges.
    """

    @staticmethod
    def verify_admin_credentials(email: str, password: str) -> bool:
        """
        Verify admin credentials against hardcoded values.
        """
        return email == ADMIN_EMAIL and password == ADMIN_PASSWORD

    @staticmethod
    def create_admin_session(email: str) -> str:
        """
        Create a new admin session token.
        """
        session_token = secrets.token_urlsafe(32)

        admin_sessions[session_token] = {
            "email": email,
            "created_at": datetime.now(),
            "last_used": datetime.now(),
            "is_admin": True,
        }

        logger.info(f"🔐 Admin session created for: {email}")
        return session_token

    @staticmethod
    def verify_admin_session(session_token: str) -> Optional[dict]:
        """
        Verify admin session token and return admin data.
        """
        if session_token not in admin_sessions:
            return None

        session = admin_sessions[session_token]

        # Check if session expired (24 hours)
        if datetime.now() - session["created_at"] > timedelta(hours=24):
            del admin_sessions[session_token]
            logger.info("🔓 Admin session expired")
            return None

        # Update last used
        session["last_used"] = datetime.now()

        return {
            "uid": "admin",
            "email": session["email"],
            "name": "Administrator",
            "is_admin": True,
            "plan": "admin",
            "role": "superuser",
        }

    @staticmethod
    def invalidate_admin_session(session_token: str):
        """Logout admin by invalidating session."""
        if session_token in admin_sessions:
            del admin_sessions[session_token]
            logger.info("🔓 Admin session invalidated")


# Security scheme
admin_security = HTTPBearer(auto_error=False)


async def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Security(admin_security),
) -> Optional[dict]:
    """
    Verify if request has valid admin token.
    Returns admin data if valid, None otherwise.
    """
    if not credentials:
        return None

    token = credentials.credentials
    admin_data = AdminAuth.verify_admin_session(token)

    if admin_data:
        logger.info(f"👑 Admin access granted: {admin_data['email']}")

    return admin_data


async def get_current_user_or_admin(
    request: Request,
    firebase_token: HTTPAuthorizationCredentials = Security(
        HTTPBearer(auto_error=False)
    ),
) -> dict:
    """
    Get current user - either regular Firebase user or Admin.
    This replaces the old get_current_user with admin support.
    """
    # First, check for admin token in header
    admin_data = await verify_admin_token(firebase_token)
    if admin_data:
        # Store in request state for downstream use
        request.state.user = admin_data
        request.state.is_admin = True
        return admin_data

    # If not admin, verify as regular Firebase user
    # Import from existing auth middleware
    from app.middleware.auth import verify_firebase_token

    try:
        if firebase_token:
            user_data = await verify_firebase_token(firebase_token)
            user_data["is_admin"] = False
            user_data["plan"] = "free"  # Default plan
            request.state.user = user_data
            request.state.is_admin = False
            return user_data
    except HTTPException:
        pass

    # No valid token
    raise HTTPException(
        status_code=401,
        detail="Authentication required. Please sign in or use admin credentials.",
    )


def require_admin(user: dict = Depends(get_current_user_or_admin)):
    """
    Dependency to require admin access.
    Raises 403 if user is not admin.
    """
    if not user.get("is_admin", False):
        raise HTTPException(
            status_code=403,
            detail="Admin access required. Please sign in with admin credentials.",
        )
    return user


def require_premium_or_admin(user: dict = Depends(get_current_user_or_admin)):
    """
    Dependency to require premium plan or admin access.
    """
    if user.get("is_admin", False):
        return user

    if user.get("plan") not in ["pro", "team", "admin"]:
        raise HTTPException(
            status_code=403, detail="Premium access required. Please upgrade your plan."
        )
    return user
