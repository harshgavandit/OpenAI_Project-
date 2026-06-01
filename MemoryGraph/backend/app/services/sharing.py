# Updated by GitHub contribution automation.
"""Sharing service for memory management."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.database import Share


class SharingService:
    """Handle memory sharing and access control."""

    def create_share(
        self,
        db: Session,
        user_id: str,
        memory_id: str,
        is_public: bool = False,
        allow_download: bool = False,
        expires_at: datetime = None,
    ) -> Share:
        """Create a new share link for a memory."""
        share = Share(
            user_id=user_id,
            memory_id=memory_id,
            is_public=is_public,
            allow_download=allow_download,
            expires_at=expires_at,
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        return share

    def get_share(self, db: Session, share_token: str) -> Share | None:
        """Get a share by token."""
        share = db.query(Share).filter(Share.share_token == share_token).first()
        if share and share.expires_at and share.expires_at < datetime.utcnow():
            return None
        return share

    def is_share_valid(self, share: Share) -> bool:
        """Check if a share is still valid (not expired, still public)."""
        if not share:
            return False
        if share.expires_at and share.expires_at < datetime.utcnow():
            return False
        return share.is_public

    def increment_view_count(self, db: Session, share_id: str) -> None:
        """Increment view count for a share."""
        share = db.query(Share).filter(Share.id == share_id).first()
        if share:
            share.view_count += 1
            db.commit()

    def list_user_shares(self, db: Session, user_id: str) -> list[Share]:
        """List all shares for a user."""
        return db.query(Share).filter(Share.user_id == user_id).order_by(Share.created_at.desc()).all()

    def delete_share(self, db: Session, share_id: str, user_id: str) -> bool:
        """Delete a share (only if owned by user)."""
        share = db.query(Share).filter(and_(Share.id == share_id, Share.user_id == user_id)).first()
        if share:
            db.delete(share)
            db.commit()
            return True
        return False

    def revoke_expired_shares(self, db: Session) -> int:
        """Revoke all expired shares. Returns count of revoked shares."""
        expired = db.query(Share).filter(Share.expires_at < datetime.utcnow()).all()
        for share in expired:
            share.is_public = False
        db.commit()
        return len(expired)
