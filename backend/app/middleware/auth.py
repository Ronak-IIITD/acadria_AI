"""
Authentication middleware for Firebase token verification.
"""
import os
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
import logging

logger = logging.getLogger(__name__)

# DEV MODE: Set to true to bypass authentication for local testing
# ⚠️ WARNING: Never enable in production!
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

if DEV_MODE:
    logger.warning("⚠️⚠️⚠️ DEV_MODE ENABLED - Authentication is bypassed! ⚠️⚠️⚠️")
    logger.warning("⚠️ This should NEVER be enabled in production!")

# Initialize Firebase Admin SDK (singleton pattern)
_firebase_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK if not already initialized."""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    try:
        # Check if Firebase credentials path is provided
        creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        
        # If path is relative, resolve it relative to the backend directory
        if creds_path:
            from pathlib import Path
            backend_dir = Path(__file__).parent.parent.parent  # backend/app/middleware -> backend
            
            if not os.path.isabs(creds_path):
                creds_path = str(backend_dir / creds_path)
            
            logger.info(f"🔍 Looking for Firebase credentials at: {creds_path}")
        
        if creds_path and os.path.exists(creds_path):
            # Initialize with service account
            cred = credentials.Certificate(creds_path)
            firebase_admin.initialize_app(cred)
            logger.info("✅ Firebase Admin initialized with service account")
        else:
            # Log warning if file not found
            if creds_path:
                logger.warning(f"⚠️ Firebase credentials file not found at: {creds_path}")
            # Initialize with default credentials (works in Google Cloud environments)
            firebase_admin.initialize_app()
            logger.info("✅ Firebase Admin initialized with default credentials")
        
        _firebase_initialized = True
    except ValueError as e:
        # App already initialized
        if "The default Firebase app already exists" in str(e):
            _firebase_initialized = True
            logger.info("✅ Firebase Admin already initialized")
        else:
            raise
    except Exception as e:
        logger.error(f"❌ Failed to initialize Firebase Admin: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Firebase authentication is not configured properly"
        )


# Security scheme for Bearer token
# auto_error=False in DEV_MODE to allow requests without auth header
security = HTTPBearer(auto_error=not DEV_MODE)
# Separate security instance for optional authentication
optional_security = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    Verify Firebase ID token and return decoded token.

    Args:
        credentials: HTTP Authorization credentials from request header

    Returns:
        dict: Decoded token containing user information

    Raises:
        HTTPException: If token is invalid or verification fails
    """
    # DEV MODE: Skip authentication
    if DEV_MODE:
        logger.info("🔓 DEV_MODE: Bypassing authentication")
        return {
            "uid": "dev-user-123",
            "email": "dev@localhost.test",
            "name": "Development User",
            "email_verified": True
        }

    if not credentials or not hasattr(credentials, 'credentials'):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )

    token = credentials.credentials
    
    try:
        # Initialize Firebase if not already done
        initialize_firebase()
        
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(token)
        
        logger.info(f"✅ Token verified for user: {decoded_token.get('uid')}")
        return decoded_token
        
    except auth.InvalidIdTokenError:
        logger.warning("⚠️ Invalid Firebase ID token")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError:
        logger.warning("⚠️ Expired Firebase ID token")
        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired"
        )
    except auth.RevokedIdTokenError:
        logger.warning("⚠️ Revoked Firebase ID token")
        raise HTTPException(
            status_code=401,
            detail="Authentication token has been revoked"
        )
    except Exception as e:
        logger.error(f"❌ Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_current_user(
    token_data: dict = Depends(verify_firebase_token)
) -> dict:
    """
    Extract current user information from verified token.
    
    Args:
        token_data: Decoded token from verify_firebase_token
        
    Returns:
        dict: User information including uid, email, etc.
    """
    return {
        "uid": token_data.get("uid"),
        "email": token_data.get("email"),
        "name": token_data.get("name"),
        "picture": token_data.get("picture"),
        "email_verified": token_data.get("email_verified", False)
    }


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(optional_security)
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
        return await verify_firebase_token(credentials)
    except HTTPException:
        return None
