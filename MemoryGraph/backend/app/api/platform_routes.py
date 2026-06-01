"""Platform endpoints: bootstrap, account utilities, streaming chat.

This module defines routes for archive bootstrapping, uploads, referrals, notifications,
and platform-specific utilities used by the frontend.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.routes import (
    active_memories_query,
    log_usage,
    memory_service,
    chat_service,
    create_weekly_report_payload,
)
from app.db import get_db
from app.models.database import Memory, User, WeeklyReport
from app.models.memory import ChatRequest
from app.services.auth import auth_service, get_current_user
from app.services.bootstrap_service import build_bootstrap
from app.services.email_service import EmailService
from app.services.password_reset import PasswordResetService
from app.services.rate_limit import rate_limit
from app.services.archive_access import assert_can_access_archive
from app.services.referral_service import referral_stats
from app.services.usage_limits import assert_can_query, assert_can_upload

platform_router = APIRouter(tags=["platform"])


def _archive_user_id(current_user: User, owner_id: str | None, db: Session) -> str:
    if not owner_id or owner_id == current_user.id:
        return current_user.id
    assert_can_access_archive(db, current_user.id, owner_id)
    return owner_id


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str = Field(min_length=8, max_length=128)


class MemoryPatchRequest(BaseModel):
    title: str | None = None
    summary: str | None = None
    people: list[str] | None = None
    places: list[str] | None = None
    events: list[str] | None = None
    dates: list[str] | None = None


@platform_router.get("/bootstrap")
async def bootstrap(
    owner_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    archive_id = _archive_user_id(current_user, owner_id, db)
    payload = build_bootstrap(db, archive_id)
    payload["archive_owner_id"] = archive_id
    payload["viewing_as_contributor"] = archive_id != current_user.id
    return payload


@platform_router.get("/referrals/me")
async def my_referrals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return referral_stats(db, current_user.id)


@platform_router.get("/notifications")
async def notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload = build_bootstrap(db, current_user.id)
    return {"notifications": payload.get("notifications", [])}


@platform_router.post("/memories/bulk-upload")
async def bulk_upload_memories(
    background_tasks: BackgroundTasks,
    request: Request,
    files: list[UploadFile] = File(...),
    archive_owner_id: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(files) > 25:
        raise HTTPException(status_code=400, detail="Maximum 25 files per bulk upload")
    rate_limit(request, f"upload:{current_user.id}", limit=20)
    target_user_id = _archive_user_id(current_user, archive_owner_id, db)
    results = []
    for upload in files:
        assert_can_upload(db, current_user.id)
        memory = await memory_service.create_pending_memory(upload, target_user_id, db)
        log_usage(
            db,
            current_user.id,
            "upload",
            "memory",
            memory.id,
            {"filename": memory.title or upload.filename, "bulk": True, "archive_owner_id": target_user_id},
        )
        background_tasks.add_task(memory_service.process_memory_job, memory.id, target_user_id)
        results.append(
            {
                "memory_id": memory.id,
                "status": memory.status,
                "processing_stage": memory.processing_stage,
                "filename": upload.filename,
            }
        )
    return {"uploaded": len(results), "items": results}


@platform_router.get("/memories/processing")
async def processing_queue(
    owner_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    archive_id = _archive_user_id(current_user, owner_id, db)
    rows = (
        active_memories_query(db, archive_id)
        .filter(Memory.archived_at.is_(None), Memory.status.in_(["pending", "processing", "failed"]))
        .order_by(Memory.updated_at.desc())
        .all()
    )
    return {
        "items": [
            {
                "memory_id": r.id,
                "title": r.title,
                "status": r.status,
                "processing_stage": r.processing_stage,
                "processing_error": r.processing_error,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rows
        ]
    }


@platform_router.patch("/memories/{memory_id}")
async def patch_memory(
    memory_id: str,
    payload: MemoryPatchRequest,
    owner_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    archive_id = _archive_user_id(current_user, owner_id, db)
    memory = (
        active_memories_query(db, archive_id)
        .filter(Memory.id == memory_id, Memory.archived_at.is_(None))
        .first()
    )
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    if payload.title is not None:
        memory.title = payload.title.strip()[:500]
    if payload.summary is not None:
        memory.summary = payload.summary.strip()
    structured = dict(memory.structured_data or {})
    if payload.people is not None:
        structured["people"] = payload.people
    if payload.places is not None:
        structured["places"] = payload.places
    if payload.events is not None:
        structured["events"] = payload.events
    if payload.dates is not None:
        structured["dates"] = payload.dates
    if payload.summary is not None:
        structured["summary"] = payload.summary
    memory.structured_data = structured
    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    record = memory_service.get_memory(db, memory_id, archive_id)
    return record.model_dump(mode="json") if record else {"memory_id": memory_id}


@platform_router.post("/memories/{memory_id}/retry")
async def retry_memory(
    memory_id: str,
    background_tasks: BackgroundTasks,
    owner_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    archive_id = _archive_user_id(current_user, owner_id, db)
    memory = active_memories_query(db, archive_id).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    memory.status = "pending"
    memory.processing_stage = "uploaded"
    memory.processing_error = None
    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    background_tasks.add_task(memory_service.process_memory_job, memory.id, archive_id)
    return {"memory_id": memory.id, "status": "pending", "processing_stage": "uploaded"}


@platform_router.get("/local-ai/setup")
async def local_ai_setup():
    from app.services.ai_provider import ai_provider

    status = ai_provider.status()
    return {
        "ollama_available": status.get("ollama", False),
        "openai_configured": status.get("openai", False),
        "active_provider": status.get("provider"),
        "recommended_steps": [
            "Install Ollama from https://ollama.com and run `ollama pull llama3.2`",
            "Set OLLAMA_BASE_URL=http://127.0.0.1:11434 in backend/.env",
            "Optional: set OPENAI_API_KEY for cloud fallback",
            "Restart the API and confirm GET /ai/status shows your provider",
        ],
    }


@platform_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "auth", limit=8)
    return PasswordResetService.request_reset(payload.email, db)


@platform_router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "auth", limit=8)
    return PasswordResetService.confirm_reset(payload.email, payload.code, payload.new_password, db)


@platform_router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rate_limit(http_request, f"chat:{current_user.id}", limit=60)
    assert_can_query(db, current_user.id)
    result = await chat_service.query_memory_graph(request.query, db=db, user_id=current_user.id)
    log_usage(db, current_user.id, "chat", "query", metadata={"query_length": len(request.query), "stream": True})
    answer = result.get("answer", "")

    async def event_generator():
        yield f"data: {json.dumps({'type': 'meta', 'proofs': result.get('proofs', []), 'sources': result.get('sources', [])})}\n\n"
        words = answer.split(" ")
        buffer = ""
        for index, word in enumerate(words):
            buffer += (" " if buffer else "") + word
            if index % 4 == 3 or index == len(words) - 1:
                yield f"data: {json.dumps({'type': 'token', 'text': buffer})}\n\n"
                buffer = ""
        yield f"data: {json.dumps({'type': 'done', 'answer': answer})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@platform_router.post("/reports/weekly/digest")
async def send_weekly_digest(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload = create_weekly_report_payload(db, current_user)
    report = WeeklyReport(
        user_id=current_user.id,
        title="Weekly family digest",
        recipient_type="self",
        subject=payload["subject"],
        body=payload["body"],
        summary_json=payload.get("summary", {}),
    )
    db.add(report)
    db.commit()
    html = f"<h1>{payload['subject']}</h1><pre>{payload['body']}</pre>"
    sent = EmailService._send_email(current_user.email, payload["subject"], html)
    return {"success": sent, "report_id": report.id}

