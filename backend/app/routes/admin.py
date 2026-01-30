"""
Admin routes for privileged operations.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from app.middleware.admin_auth import (
    AdminAuth,
    AdminLoginRequest,
    require_admin,
    get_current_user_or_admin,
)
from app.middleware.auth import get_current_user
import logging

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)
security = HTTPBearer()


@router.post("/login")
async def admin_login(credentials: AdminLoginRequest):
    """
    Admin login endpoint.
    Returns session token for admin access.
    """
    logger.info(f"🔑 Admin login attempt: {credentials.email}")

    if not AdminAuth.verify_admin_credentials(credentials.email, credentials.password):
        logger.warning(f"❌ Failed admin login attempt: {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # Create admin session
    session_token = AdminAuth.create_admin_session(credentials.email)

    logger.info(f"✅ Admin logged in: {credentials.email}")

    return {
        "success": True,
        "message": "Admin login successful",
        "session_token": session_token,
        "admin": {
            "email": credentials.email,
            "role": "superuser",
            "privileges": [
                "all_models_access",
                "unlimited_usage",
                "user_impersonation",
                "system_management",
            ],
        },
    }


@router.post("/logout")
async def admin_logout(
    token: str = Depends(security), admin: dict = Depends(require_admin)
):
    """
    Admin logout endpoint.
    Invalidates admin session.
    """
    AdminAuth.invalidate_admin_session(token.credentials)
    return {"success": True, "message": "Admin logged out successfully"}


@router.get("/verify")
async def verify_admin_session(admin: dict = Depends(require_admin)):
    """
    Verify admin session is valid.
    Returns admin information.
    """
    return {
        "is_admin": True,
        "email": admin["email"],
        "role": admin.get("role", "superuser"),
        "privileges": [
            "all_models_access",
            "unlimited_usage",
            "user_impersonation",
            "system_management",
        ],
    }


@router.get("/users/list")
async def list_all_users(admin: dict = Depends(require_admin)):
    """
    Admin: List all users in system.
    """
    # TODO: Query from database
    # For now, return mock data
    return {
        "users": [
            {
                "uid": "user_123",
                "email": "user@example.com",
                "plan": "free",
                "documents": 5,
                "questions": 23,
                "joined": "2026-01-15",
            },
            {
                "uid": "user_456",
                "email": "pro@example.com",
                "plan": "pro",
                "documents": 45,
                "questions": 156,
                "joined": "2026-01-20",
            },
        ],
        "total": 2,
        "summary": {"free": 1, "pro": 1, "team": 0},
    }


@router.get("/system/stats")
async def get_system_stats(admin: dict = Depends(require_admin)):
    """
    Admin: Get system-wide statistics.
    """
    return {
        "total_users": 150,
        "total_documents": 1250,
        "total_questions": 8900,
        "api_calls_today": 450,
        "storage_used_gb": 45.2,
        "active_sessions": 23,
    }


@router.post("/users/impersonate/{user_id}")
async def impersonate_user(user_id: str, admin: dict = Depends(require_admin)):
    """
    Admin: Impersonate a user for support purposes.
    Returns temporary token to act as that user.
    """
    # TODO: Generate temporary impersonation token
    logger.info(f"👤 Admin {admin['email']} impersonating user: {user_id}")

    return {
        "impersonation_token": "temp_token_here",
        "user_id": user_id,
        "expires_in": 3600,  # 1 hour
        "message": f"Now acting as user {user_id}",
    }
