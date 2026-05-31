"""Family archive sharing: contributor access checks."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.database import FamilyArchiveAccess


def can_contribute(db: Session, member_user_id: str, owner_user_id: str) -> bool:
    if member_user_id == owner_user_id:
        return True
    row = (
        db.query(FamilyArchiveAccess)
        .filter(
            FamilyArchiveAccess.owner_user_id == owner_user_id,
            FamilyArchiveAccess.member_user_id == member_user_id,
        )
        .first()
    )
    return row is not None


def assert_can_access_archive(db: Session, member_user_id: str, owner_user_id: str) -> None:
    if not can_contribute(db, member_user_id, owner_user_id):
        raise HTTPException(status_code=403, detail="You do not have access to this family archive")


def list_shared_archives(db: Session, member_user_id: str) -> list[dict]:
    rows = (
        db.query(FamilyArchiveAccess)
        .filter(FamilyArchiveAccess.member_user_id == member_user_id)
        .order_by(FamilyArchiveAccess.created_at.desc())
        .all()
    )
    from app.models.database import User

    results = []
    for row in rows:
        owner = db.get(User, row.owner_user_id)
        results.append(
            {
                "owner_id": row.owner_user_id,
                "owner_name": owner.full_name if owner else "Family archivist",
                "role": row.role,
            }
        )
    return results
