# Updated by GitHub contribution automation.
"""Simple referral codes tracked via usage logs (no extra migration)."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.database import UsageLog, User


def referral_code_for_user(user_id: str) -> str:
    return user_id.replace("-", "")[:10].upper()


def _find_user_by_code(db: Session, code: str) -> User | None:
    normalized = code.strip().upper()
    if not normalized:
        return None
    for user in db.query(User).all():
        if referral_code_for_user(user.id) == normalized:
            return user
    return None


def referral_stats(db: Session, user_id: str) -> dict:
    signups = (
        db.query(UsageLog)
        .filter(UsageLog.action == "referral_signup", UsageLog.resource_id == user_id)
        .count()
    )
    return {
        "code": referral_code_for_user(user_id),
        "signups": signups,
        "share_url_path": f"/auth/register?ref={referral_code_for_user(user_id)}",
    }


def record_referral_signup(db: Session, new_user_id: str, code: str | None) -> dict:
    if not code:
        return {"applied": False}
    referrer = _find_user_by_code(db, code)
    if not referrer or referrer.id == new_user_id:
        return {"applied": False}
    existing = (
        db.query(UsageLog)
        .filter(UsageLog.user_id == new_user_id, UsageLog.action == "referral_signup")
        .first()
    )
    if existing:
        return {"applied": False, "reason": "already_recorded"}
    db.add(
        UsageLog(
            user_id=new_user_id,
            action="referral_signup",
            resource_type="referral",
            resource_id=referrer.id,
            metadata_json={"code": code.strip().upper()},
        )
    )
    db.commit()
    return {"applied": True, "referrer_id": referrer.id}
