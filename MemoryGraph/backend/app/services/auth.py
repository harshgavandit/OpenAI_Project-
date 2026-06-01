# Updated by GitHub contribution automation.
import os
import secrets
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.auth import UserRead
from app.models.database import Subscription, User, Session as SessionModel
from app.services.auth_cookies import ACCESS_COOKIE, REFRESH_COOKIE

load_dotenv()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080"))
FREE_PLAN_STORAGE_LIMIT_MB = int(os.getenv("FREE_PLAN_STORAGE_LIMIT_MB", "500"))


def as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class AuthService:
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, password: str, hashed_password: str) -> bool:
        return pwd_context.verify(password, hashed_password)

    def create_session_pair(self, user_id: str, db: Session) -> SessionModel:
        now = datetime.now(timezone.utc)
        session = SessionModel(
            user_id=user_id,
            token=secrets.token_urlsafe(32),
            refresh_token=secrets.token_urlsafe(48),
            expires_at=now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            refresh_expires_at=now + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def create_access_token(self, user_id: str, db: Session) -> str:
        """Backward-compatible helper — creates full session pair."""
        return self.create_session_pair(user_id, db).token

    def refresh_access_token(self, refresh_token: str, db: Session) -> SessionModel | None:
        session = db.query(SessionModel).filter(SessionModel.refresh_token == refresh_token).first()
        if not session:
            return None
        refresh_expires = as_utc(session.refresh_expires_at)
        if refresh_expires and datetime.now(timezone.utc) > refresh_expires:
            db.delete(session)
            db.commit()
            return None
        now = datetime.now(timezone.utc)
        session.token = secrets.token_urlsafe(32)
        session.expires_at = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        db.commit()
        db.refresh(session)
        return session

    def revoke_session(self, db: Session, access_token: str | None = None, refresh_token: str | None = None) -> None:
        query = db.query(SessionModel)
        if access_token and refresh_token:
            query = query.filter(
                (SessionModel.token == access_token) | (SessionModel.refresh_token == refresh_token)
            )
        elif access_token:
            query = query.filter(SessionModel.token == access_token)
        elif refresh_token:
            query = query.filter(SessionModel.refresh_token == refresh_token)
        else:
            return
        query.delete(synchronize_session=False)
        db.commit()

    def resolve_session_from_access_token(self, token: str, db: Session) -> SessionModel | None:
        session = db.query(SessionModel).filter(SessionModel.token == token).first()
        if not session:
            return None
        expires_at = as_utc(session.expires_at)
        if expires_at and datetime.now(timezone.utc) > expires_at:
            return None
        return session

    def create_user(self, db: Session, email: str, password: str, full_name: str | None) -> User:
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        user = User(
            email=email.lower(),
            full_name=full_name,
            hashed_password=self.hash_password(password),
        )
        db.add(user)
        db.flush()
        db.add(
            Subscription(
                user_id=user.id,
                plan="free",
                status="active",
                storage_limit_mb=FREE_PLAN_STORAGE_LIMIT_MB,
            )
        )
        db.commit()
        db.refresh(user)
        return user

    def authenticate_user(self, db: Session, email: str, password: str) -> User:
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if user.auth_method != "email" or not user.hashed_password:
            raise HTTPException(status_code=401, detail="This account uses OAuth. Please login via Google.")
        if not self.verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled")
        return user

    def to_user_read(self, user: User) -> UserRead:
        subscription = user.subscription
        return UserRead(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            plan=subscription.plan if subscription else "free",
            storage_limit_mb=subscription.storage_limit_mb if subscription else FREE_PLAN_STORAGE_LIMIT_MB,
            current_storage_bytes=subscription.current_storage_bytes if subscription else 0,
        )

    def cookie_max_ages(self, session: SessionModel) -> tuple[int, int]:
        now = datetime.now(timezone.utc)
        access_exp = as_utc(session.expires_at) or now
        refresh_exp = as_utc(session.refresh_expires_at) or now + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
        access_max = max(60, int((access_exp - now).total_seconds()))
        refresh_max = max(3600, int((refresh_exp - now).total_seconds()))
        return access_max, refresh_max


auth_service = AuthService()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    access_cookie: str | None = Cookie(None, alias=ACCESS_COOKIE),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials if credentials else access_cookie
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session = auth_service.resolve_session_from_access_token(token, db)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.get(User, session.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user
