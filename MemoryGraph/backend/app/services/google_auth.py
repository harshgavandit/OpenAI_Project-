# Updated by GitHub contribution automation.
"""Google OAuth service for authentication"""
import os
import httpx
from sqlalchemy.orm import Session
from app.models.database import Subscription, User

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
FREE_PLAN_STORAGE_LIMIT_MB = int(os.getenv("FREE_PLAN_STORAGE_LIMIT_MB", "500"))


class GoogleAuthService:
    """Handle Google OAuth authentication"""

    @staticmethod
    def get_google_auth_url() -> str:
        """Get Google OAuth authorization URL"""
        redirect_uri = f"{FRONTEND_URL}/auth/login"
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={GOOGLE_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20profile%20email&"
            f"access_type=offline"
        )

    @staticmethod
    async def verify_and_get_user_info(code: str) -> dict:
        """Exchange authorization code for user info"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Try with just the domain first (most common)
            redirect_uris = [
                FRONTEND_URL,
                f"{FRONTEND_URL}/",
                f"{FRONTEND_URL}/auth/login",
            ]
            
            token_response = None
            last_error = None
            
            async with httpx.AsyncClient() as client:
                # Try each redirect_uri until one works
                for redirect_uri in redirect_uris:
                    logger.info(f"Attempting token exchange with redirect_uri: {redirect_uri}")
                    
                    try:
                        token_response = await client.post(
                            "https://oauth2.googleapis.com/token",
                            data={
                                "client_id": GOOGLE_CLIENT_ID,
                                "client_secret": GOOGLE_CLIENT_SECRET,
                                "code": code,
                                "grant_type": "authorization_code",
                                "redirect_uri": redirect_uri,
                            },
                            timeout=10.0,
                        )
                        
                        if token_response.status_code == 200:
                            logger.info(f"Success with redirect_uri: {redirect_uri}")
                            break
                        else:
                            error_detail = token_response.text
                            logger.warning(f"Failed with {redirect_uri}: {token_response.status_code} - {error_detail}")
                            last_error = error_detail
                    except Exception as e:
                        logger.warning(f"Exception with {redirect_uri}: {str(e)}")
                        last_error = str(e)
                        continue
                
                if not token_response or token_response.status_code != 200:
                    error_msg = f"Failed to exchange code for token. Last error: {last_error}"
                    logger.error(error_msg)
                    return {"success": False, "message": error_msg}
                
                token_data = token_response.json()
                access_token = token_data.get("access_token")
                
                if not access_token:
                    logger.error(f"No access token in response: {token_data}")
                    return {"success": False, "message": "No access token received"}
                
                # Get user info using access token
                user_info_response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0,
                )
                
                if user_info_response.status_code != 200:
                    logger.error(f"Failed to get user info: {user_info_response.status_code} - {user_info_response.text}")
                    return {"success": False, "message": "Failed to get user info"}
                
                user_info = user_info_response.json()
                logger.info(f"Successfully retrieved user info for: {user_info.get('email')}")
                
                return {
                    "success": True,
                    "google_id": user_info.get("id"),
                    "email": user_info.get("email"),
                    "full_name": user_info.get("name"),
                    "picture": user_info.get("picture"),
                    "verified_email": user_info.get("verified_email", False),
                }
        except Exception as e:
            logger.exception(f"Unexpected error in verify_and_get_user_info: {str(e)}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}

    @staticmethod
    def get_or_create_user(
        google_id: str, email: str, full_name: str, db: Session
    ) -> tuple[User, bool]:
        """Get existing user or create new one (auto-register)"""
        def ensure_subscription(user: User):
            subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
            if not subscription:
                db.add(
                    Subscription(
                        user_id=user.id,
                        plan="free",
                        status="active",
                        storage_limit_mb=FREE_PLAN_STORAGE_LIMIT_MB,
                    )
                )

        # Check if user exists with this Google ID
        user = db.query(User).filter(User.google_id == google_id).first()

        if user:
            ensure_subscription(user)
            db.commit()
            return user, False

        # Check if user exists with this email
        user = db.query(User).filter(User.email == email).first()

        if user:
            # Existing email user - link Google ID
            user.google_id = google_id
            user.auth_method = "google"
            user.email_verified = True
            ensure_subscription(user)
            db.commit()
            return user, False

        # Create new user (auto-register)
        new_user = User(
            email=email,
            full_name=full_name,
            hashed_password="",  # Google users don't need password
            google_id=google_id,
            auth_method="google",
            email_verified=True,  # Google provides verified email
            is_active=True,
        )
        db.add(new_user)
        db.flush()
        ensure_subscription(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user, True

    @staticmethod
    def get_google_callback_url(code: str, state: str = None) -> str:
        """Generate callback URL for frontend redirect"""
        # This is used to construct the redirect back to frontend after backend verification
        return f"{FRONTEND_URL}/auth/callback?code={code}&state={state or ''}"
