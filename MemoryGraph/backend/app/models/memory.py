from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MemoryMetadata(BaseModel):
    upload_date: datetime
    original_filename: str
    stored_filename: str
    file_path: str
    content_type: str | None = None
    file_size: int
    extension: str
    image_metadata: dict[str, Any] = Field(default_factory=dict)


class StructuredMemory(BaseModel):
    people: list[str] = Field(default_factory=list)
    places: list[str] = Field(default_factory=list)
    events: list[str] = Field(default_factory=list)
    dates: list[str] = Field(default_factory=list)
    summary: str = ""


class MemoryRecord(BaseModel):
    memory_id: str
    user_id: str | None = None
    metadata: MemoryMetadata
    raw_text: str
    structured_data: StructuredMemory
    status: str = "completed"
    processing_stage: str = "completed"
    processing_error: str | None = None
    created_at: datetime
    updated_at: datetime


class ChatRequest(BaseModel):
    query: str


class MemoryUploadResponse(BaseModel):
    memory_id: str
    status: str
    processing_stage: str


class MemoryStatusResponse(BaseModel):
    memory_id: str
    status: str
    processing_stage: str
    processing_error: str | None = None


class TimeMachineRequest(BaseModel):
    query: str
    birth_year: int | None = None
    owner_id: str | None = None


class MemoryProof(BaseModel):
    memory_id: str
    title: str
    summary: str = ""
    status: str = "completed"
    processing_stage: str = "completed"
    evidence: dict = Field(default_factory=dict)
    confidence: float = 0.5
    created_at: str | None = None


class TimeMachineResponse(BaseModel):
    query: str
    needs_birth_year: bool = False
    resolved_person: str | None = None
    year_start: int | None = None
    year_end: int | None = None
    narrative: str
    timeline: list[dict] = Field(default_factory=list)
    memories: list[MemoryRecord] = Field(default_factory=list)
    relationships: list[dict[str, str]] = Field(default_factory=list)
    proofs: list[MemoryProof] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    sources: list[MemoryRecord] = Field(default_factory=list)
    relationships: list[dict[str, str]] = Field(default_factory=list)
    proofs: list[MemoryProof] = Field(default_factory=list)


class ShareResponse(BaseModel):
    share_id: str
    share_token: str
    memory_id: str
    is_public: bool
    allow_download: bool
    expires_at: datetime | None = None
    created_at: datetime
    share_link: str


class CreateShareRequest(BaseModel):
    memory_id: str
    is_public: bool = False
    allow_download: bool = False
    expires_at: datetime | None = None


class UsageStatsResponse(BaseModel):
    plan: str
    current_storage_bytes: int
    storage_limit_mb: int
    memories_count: int
    daily_uploads: int
    daily_upload_limit: int
    daily_queries: int
    daily_query_limit: int
