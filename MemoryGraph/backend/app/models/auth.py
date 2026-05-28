from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=200)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class GoogleCallbackRequest(BaseModel):
    code: str


class UserRead(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    plan: str = "free"
    storage_limit_mb: int = 500
    current_storage_bytes: int = 0


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
