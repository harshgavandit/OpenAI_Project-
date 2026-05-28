import os
import secrets
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.auth import UserRead
from app.models.database import Subscription, User

load_dotenv()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
bearer_scheme = HTTPBearer()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
FREE_PLAN_STORAGE_LIMIT_MB = int(os.getenv("FREE_PLAN_STORAGE_LIMIT_MB", "500"))

# Simple session store (in production, use Redis or database)
_session_store: dict[str, dict] = {}


class AuthService:
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, password: str, hashed_password: str) -> bool:
        return pwd_context.verify(password, hashed_password)

    def create_access_token(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        _session_store[token] = {
            "user_id": user_id,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        return token

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
        if not user or not self.verify_password(password, user.hashed_password):
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


auth_service = AuthService()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    session = _session_store.get(token)
    
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    if datetime.now(timezone.utc) > session["expires_at"]:
        _session_store.pop(token, None)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    
    user = db.get(User, session["user_id"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user
