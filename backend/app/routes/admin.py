"""
Admin routes for privileged operations.
Uses Clerk JWT verification for authorization.
Admin access is granted based on verified Clerk JWT metadata/roles,
not a separate password system.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from app.middleware.auth import verify_clerk_token, get_current_user
import logging

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)
security = HTTPBearer()


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require admin access based on Clerk JWT claims.
    Checks user metadata for admin role.
    Raises 403 if user is not admin.
    """
    if not user.get("is_admin", False):
        raise HTTPException(
            status_code=403,
            detail="Admin access required. User must have admin role in Clerk.",
        )
    return user


def require_admin_or_premium(user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require admin or premium plan access.
    """
    if user.get("is_admin", False):
        return user
    if user.get("plan") not in ["pro", "team", "admin"]:
        raise HTTPException(
            status_code=403, detail="Premium or admin access required."
        )
    return user


@router.post("/login")
async def admin_login():
    """
    Admin login endpoint.
    Note: Admin access is now handled via Clerk authentication
    with appropriate metadata/roles. No separate password system.
    """
    # Admin access is determined by Clerk JWT claims/metadata
    # No separate login needed - Clerk handles authentication
    return {
        "success": True,
        "message": "Admin access is managed via Clerk authentication",
        "note": "Ensure user has 'admin' role or metadata in Clerk dashboard",
    }


@router.post("/logout")
async def admin_logout(
    token: str = Depends(security), admin: dict = Depends(require_admin)
):
    """
    Admin logout endpoint.
    Invalidates admin session - Clerk handles token revocation.
    """
    # Clerk handles token revocation on logout
    return {"success": True, "message": "Admin logged out successfully"}


@router.get("/verify")
async def verify_admin_session(
    token: str = Depends(security), user: dict = Depends(require_admin)
):
    """
    Verify admin session is valid.
    Returns admin information from verified Clerk token.
    """
    return {
        "is_admin": True,
        "email": user.get("email"),
        "role": user.get("role", "superuser"),
        "privileges": user.get("privileges", []),
    }


@router.get("/users/list")
async def list_all_users(admin: dict = Depends(require_admin)):
    """
    Admin: List all users in system.
    """
    # In production, this would query from the database
    # For now, return structured response noting admin access
    return {
        "users": [],
        "total": 0,
        "summary": {"free": 0, "pro": 0, "team": 0, "admin": 0},
        "note": "User list requires database integration. Admin access verified via Clerk.",
    }


@router.get("/system/stats")
async def get_system_stats(admin: dict = Depends(require_admin)):
    """
    Admin: Get system-wide statistics.
    """
    return {
        "total_users": 0,
        "total_documents": 0,
        "total_questions": 0,
        "api_calls_today": 0,
        "storage_used_gb": 0,
        "active_sessions": 0,
        "note": "Statistics require backend database integration.",
    }


@router.post("/users/impersonate/{user_id}")
async def impersonate_user(user_id: str, admin: dict = Depends(require_admin)):
    """
    Admin: Impersonate a user for support purposes.
    Returns temporary token to act as that user.
    """
    # Impersonation requires proper backend implementation
    # and should use Clerk-backed session management
    return {
        "impersonation_token": None,
        "user_id": user_id,
        "expires_in": None,
        "message": "User impersonation requires proper backend implementation",
    }
