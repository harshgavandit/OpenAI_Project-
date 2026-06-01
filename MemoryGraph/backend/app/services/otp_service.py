# Updated by GitHub contribution automation.
"""OTP generation and verification service"""
import os
import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.database import OTPLog
from app.services.email_service import EmailService

OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", 5))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", 3))
DEV_LOG_OTP = os.getenv("DEV_LOG_OTP", "true").lower() in {"1", "true", "yes"}


def as_utc(dt: datetime | None) -> datetime | None:
    """Normalize SQLite/Postgres datetimes for safe comparison."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class OTPService:
    """Generate, store, and verify OTP codes"""

    @staticmethod
    def generate_otp() -> str:
        """Generate a 6-digit OTP"""
        return "".join(random.choices(string.digits, k=6))

    @staticmethod
    def create_and_send_otp(user_id: str, email: str, db: Session) -> dict:
        """Create OTP and send via email"""
        try:
            otp_code = OTPService.generate_otp()
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

            otp_log = OTPLog(
                user_id=user_id,
                email=email,
                code=otp_code,
                attempts=0,
                expires_at=expires_at,
            )
            db.add(otp_log)
            db.commit()
            db.refresh(otp_log)

            email_sent = EmailService.send_otp_email(email, otp_code)

            if not email_sent:
                if DEV_LOG_OTP:
                    print(f"[MemoryGraph DEV OTP] {email} -> {otp_code} (expires in {OTP_EXPIRY_MINUTES} min)")
                    return {
                        "success": True,
                        "message": "OTP logged to server console (dev mode — check backend terminal)",
                        "otp_id": otp_log.id,
                        "expires_in_minutes": OTP_EXPIRY_MINUTES,
                        "dev_mode": True,
                    }
                return {"success": False, "message": "Failed to send OTP email. Configure GMAIL_EMAIL and GMAIL_APP_PASSWORD."}

            return {
                "success": True,
                "message": "OTP sent to email",
                "otp_id": otp_log.id,
                "expires_in_minutes": OTP_EXPIRY_MINUTES,
            }
        except Exception as e:
            return {"success": False, "message": str(e)}

    @staticmethod
    def verify_otp(user_id: str, email: str, provided_code: str, db: Session) -> dict:
        """Verify OTP code"""
        try:
            now = datetime.now(timezone.utc)
            normalized_code = "".join(ch for ch in provided_code.strip() if ch.isdigit())

            otp_log = (
                db.query(OTPLog)
                .filter(OTPLog.user_id == user_id, OTPLog.email == email.lower())
                .order_by(OTPLog.created_at.desc())
                .first()
            )

            if not otp_log:
                return {"success": False, "message": "No OTP found for this email"}

            expires_at = as_utc(otp_log.expires_at)
            if expires_at and now > expires_at:
                return {"success": False, "message": "OTP has expired"}

            if otp_log.verified_at:
                return {"success": False, "message": "OTP already used"}

            if otp_log.attempts >= OTP_MAX_ATTEMPTS:
                return {"success": False, "message": "Maximum OTP attempts exceeded"}

            if normalized_code != otp_log.code:
                otp_log.attempts += 1
                db.commit()
                remaining = OTP_MAX_ATTEMPTS - otp_log.attempts
                return {
                    "success": False,
                    "message": f"Invalid OTP. {remaining} attempts remaining",
                }

            # Mark as verified
            otp_log.verified_at = now
            db.commit()

            return {"success": True, "message": "OTP verified successfully"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    @staticmethod
    def is_email_verified(user_id: str, email: str, db: Session) -> bool:
        """Check if email has been verified via OTP"""
        try:
            otp_log = (
                db.query(OTPLog)
                .filter(
                    OTPLog.user_id == user_id,
                    OTPLog.email == email,
                    OTPLog.verified_at.isnot(None),
                )
                .order_by(OTPLog.created_at.desc())
                .first()
            )
            return otp_log is not None
        except Exception:
            return False
