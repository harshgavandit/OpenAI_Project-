"""Password reset via email OTP."""

from sqlalchemy.orm import Session

from app.models.database import User
from app.services.auth import auth_service
from app.services.otp_service import OTPService


class PasswordResetService:
    @staticmethod
    def request_reset(email: str, db: Session) -> dict:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user or user.auth_method == "google" or not user.hashed_password:
            return {"success": True, "message": "If an account exists, a reset code was sent."}
        return OTPService.create_and_send_otp(user.id, user.email, db)

    @staticmethod
    def confirm_reset(email: str, code: str, new_password: str, db: Session) -> dict:
        if len(new_password) < 8:
            return {"success": False, "message": "Password must be at least 8 characters"}
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user:
            return {"success": False, "message": "Invalid reset request"}
        verified = OTPService.verify_otp(user.id, user.email, code, db)
        if not verified.get("success"):
            return verified
        user.hashed_password = auth_service.hash_password(new_password)
        user.auth_method = "email"
        db.commit()
        return {"success": True, "message": "Password updated. You can sign in now."}
