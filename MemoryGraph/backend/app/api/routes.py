from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.responses import StreamingResponse
import io
import csv
import networkx as nx
import json
from datetime import datetime, timedelta

from app.db import get_db
from app.models.auth import TokenResponse, UserCreate, UserLogin, UserRead
from app.models.database import Memory, Relationship, User, Share, UsageLog, Subscription, TimelineEvent, Media
from app.models.memory import ChatRequest, MemoryStatusResponse, MemoryUploadResponse, TimeMachineRequest, ShareResponse, CreateShareRequest, UsageStatsResponse
from app.services.auth import auth_service, get_current_user
from app.services.chat_service import ChatService
from app.services.memory import MemoryService
from app.services.rate_limit import rate_limit
from app.services.timeline_service import TimelineService
from app.services.time_machine import TimeMachineService
from app.services.export_service import export_service

router = APIRouter()

memory_service = MemoryService()
chat_service = ChatService(memory_service)
timeline_service = TimelineService(memory_service)
time_machine_service = TimeMachineService(memory_service)


@router.get("/health")
async def health():
    return {"status": "ok", "service": "MemoryGraph AI API"}


@router.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "auth", limit=10)
    user = auth_service.create_user(db, payload.email, payload.password, payload.full_name)
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token, user=auth_service.to_user_read(user))


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "auth", limit=10)
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token, user=auth_service.to_user_read(user))


@router.get("/auth/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return auth_service.to_user_read(current_user)


@router.post("/auth/send-otp")
async def send_otp(payload: dict, request: Request, db: Session = Depends(get_db)):
    """Send OTP to email for verification"""
    from app.services.otp_service import OTPService
    
    rate_limit(request, "auth", limit=5)
    email = payload.get("email", "").lower()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = OTPService.create_and_send_otp(user.id, email, db)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message"))
    
    return {"success": True, "message": result.get("message"), "expires_in_minutes": result.get("expires_in_minutes")}


@router.post("/auth/verify-otp")
async def verify_otp(payload: dict, request: Request, db: Session = Depends(get_db)):
    """Verify OTP code and mark email as verified"""
    from app.services.otp_service import OTPService
    from app.models.auth import VerifyOTPRequest
    
    rate_limit(request, "auth", limit=5)
    email = payload.get("email", "").lower()
    otp_code = payload.get("code", "")
    
    if not email or not otp_code:
        raise HTTPException(status_code=400, detail="Email and code are required")
    
    # Get user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify OTP
    result = OTPService.verify_otp(user.id, email, otp_code, db)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    
    # Mark email as verified
    user.email_verified = True
    db.commit()
    
    # Create token
    token = auth_service.create_access_token(user.id)
    
    return TokenResponse(access_token=token, user=auth_service.to_user_read(user))


@router.post("/auth/google/callback")
async def google_callback(payload: dict, request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    from app.services.google_auth import GoogleAuthService
    from app.services.email_service import EmailService
    
    rate_limit(request, "auth", limit=10)
    code = payload.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is required")
    
    # Exchange code for user info
    user_info = await GoogleAuthService.verify_and_get_user_info(code)
    
    if not user_info.get("success"):
        raise HTTPException(status_code=400, detail=user_info.get("message"))
    
    google_id = user_info.get("google_id")
    email = user_info.get("email")
    full_name = user_info.get("full_name")
    
    # Get or create user
    user, is_new = GoogleAuthService.get_or_create_user(google_id, email, full_name, db)
    
    # Send welcome email if new user
    if is_new:
        EmailService.send_welcome_email(email, full_name)
    
    # Create token
    token = auth_service.create_access_token(user.id)
    
    return TokenResponse(access_token=token, user=auth_service.to_user_read(user))


@router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (invalidate token on frontend)"""
    return {"success": True, "message": "Logged out successfully"}


@router.post("/memories/upload")
async def upload_and_process_memory(
    background_tasks: BackgroundTasks,
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemoryUploadResponse:
    try:
        rate_limit(request, f"upload:{current_user.id}", limit=20)

        # Save upload and create pending memory record
        memory = await memory_service.create_pending_memory(file, current_user.id, db)

        # Determine incoming size from stored metadata (safe fallback to 0)
        incoming_size = 0
        try:
            incoming_size = int((memory.metadata_json or {}).get("file_size", 0))
        except Exception:
            incoming_size = 0

        # Enforce subscription storage limits after saving (cleanup if exceeded)
        subscription = current_user.subscription
        if subscription and subscription.current_storage_bytes + incoming_size > subscription.storage_limit_mb * 1024 * 1024:
            # Remove saved media and memory record to respect limits
            try:
                db.query(Media).filter(Media.memory_id == memory.id, Media.user_id == current_user.id).delete()
                db.delete(memory)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=402, detail="Storage limit reached for current plan")

        log_usage(db, current_user.id, "upload", "memory", memory.id, {"filename": memory.title or file.filename, "size": incoming_size})
        background_tasks.add_task(memory_service.process_memory_job, memory.id, current_user.id)
        return MemoryUploadResponse(
            memory_id=memory.id,
            status=memory.status,
            processing_stage=memory.processing_stage,
        )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/memories")
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "memories": [
            record.model_dump(mode="json")
            for record in memory_service.list_memories(db=db, user_id=current_user.id)
        ]
    }


@router.get("/memories/search")
async def search_memories(
    query: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = memory_service.search_memories(db, current_user.id, query, limit=limit)
    return {"results": [record.model_dump(mode="json") for record in records]}


@router.get("/memories/{memory_id}")
async def get_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = memory_service.get_memory(db, memory_id, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Memory not found")
    return record.model_dump(mode="json")


@router.get("/memories/{memory_id}/status", response_model=MemoryStatusResponse)
async def get_memory_status(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memory = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return MemoryStatusResponse(
        memory_id=memory.id,
        status=memory.status,
        processing_stage=memory.processing_stage,
        processing_error=memory.processing_error,
    )


@router.post("/chat")
async def chat(
    request: ChatRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        rate_limit(http_request, f"chat:{current_user.id}", limit=60)
        result = await chat_service.query_memory_graph(request.query, db=db, user_id=current_user.id)
        log_usage(db, current_user.id, "chat", "query", metadata={"query_length": len(request.query)})
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/timeline/range")
async def get_timeline_range(
    start: int,
    end: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await timeline_service.get_memories_in_range(db, start, end, user_id=current_user.id)


@router.get("/timeline/years")
async def get_years(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await timeline_service.get_all_years(db, user_id=current_user.id)


@router.post("/time-machine/query")
async def query_time_machine(
    request: TimeMachineRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rate_limit(http_request, f"time-machine:{current_user.id}", limit=30)
    return time_machine_service.query(
        db,
        user_id=current_user.id,
        query=request.query,
        birth_year=request.birth_year,
    ).model_dump(mode="json")


@router.post("/demo/seed")
async def seed_demo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = memory_service.seed_demo_memories(db, current_user.id)
    return {"created": len(records), "memories": [record.model_dump(mode="json") for record in records]}


@router.post("/billing/checkout")
async def billing_checkout(current_user: User = Depends(get_current_user)):
    return {
        "status": "not_configured",
        "message": "Stripe checkout is ready to wire when billing keys are configured.",
        "user_id": current_user.id,
    }


@router.post("/billing/portal")
async def billing_portal(current_user: User = Depends(get_current_user)):
    return {
        "status": "not_configured",
        "message": "Stripe customer portal is ready to wire when billing keys are configured.",
        "user_id": current_user.id,
    }


@router.get("/graph/visualize")
async def visualize_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Relationship).filter(Relationship.user_id == current_user.id).limit(100).all()
    nodes_by_id = {}
    links = []
    for row in rows:
        nodes_by_id[f"{row.source_type}:{row.source_id}"] = {"id": row.source_id, "group": row.source_type, "label": row.source_id}
        nodes_by_id[f"{row.target_type}:{row.target_id}"] = {"id": row.target_id, "group": row.target_type, "label": row.target_id}
        links.append({"source": row.source_id, "target": row.target_id, "label": row.relation})
    nodes = list(nodes_by_id.values())
    return {"nodes": nodes, "links": links}


@router.get("/graph/query")
async def query_graph(query: str = "", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    like = f"%{query}%"
    rows = db.query(Relationship).filter(Relationship.user_id == current_user.id)
    if query:
        rows = rows.filter(Relationship.source_id.ilike(like) | Relationship.target_id.ilike(like))
    return {
        "relationships": [
            {"source": row.source_id, "relation": row.relation, "target": row.target_id}
            for row in rows.limit(30).all()
        ]
    }


@router.get("/memories/insights")
async def memories_insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return lightweight AI insights: summaries, simple duplicate detection, and top people."""
    rows = db.query(Memory).filter(Memory.user_id == current_user.id).all()
    summaries = [
        {
            "memory_id": r.id,
            "title": getattr(r, "title", ""),
            "summary": getattr(r, "summary", "") or (r.structured_data.get("summary") if getattr(r, "structured_data", None) else ""),
        }
        for r in rows
    ]

    # Naive duplicate detection (prefix match of raw_text)
    groups: dict[str, list[str]] = {}
    for r in rows:
        key = (getattr(r, "raw_text", "") or "")[:200]
        groups.setdefault(key, []).append(r.id)
    duplicates = [g for g in groups.values() if len(g) > 1]

    # Top people
    top_people: dict[str, int] = {}
    for r in rows:
        sd = r.structured_data if getattr(r, "structured_data", None) else {}
        people = []
        try:
            if isinstance(sd, dict):
                people = sd.get("people", [])
            else:
                people = getattr(sd, "people", [])
        except Exception:
            people = []
        for p in people:
            top_people[p] = top_people.get(p, 0) + 1

    top_people_list = sorted([(k, v) for k, v in top_people.items()], key=lambda x: -x[1])[:10]

    return {"count": len(rows), "summaries": summaries, "duplicates": duplicates, "top_people": top_people_list}


@router.get("/export/memories")
async def export_memories(format: str = "csv", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export memories as CSV (lightweight)."""
    rows = db.query(Memory).filter(Memory.user_id == current_user.id).all()
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["memory_id", "title", "summary"])
        for r in rows:
            summary = getattr(r, "summary", "") or (r.structured_data.get("summary") if getattr(r, "structured_data", None) else "")
            writer.writerow([r.id, getattr(r, "title", ""), summary])
        output.seek(0)
        return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=memories.csv"})
    raise HTTPException(status_code=400, detail="Unsupported format")


@router.get("/graph/insights")
async def graph_insights(current_user: User = Depends(get_current_user)):
    """Return simple graph insights: connected components and influential nodes by degree."""
    g = memory_service.storage.graph
    if g is None or len(g.nodes) == 0:
        return {"communities": [], "influential": []}

    # connected components (largest first)
    comps = sorted(nx.connected_components(g), key=lambda c: -len(c))
    top_communities = [{"size": len(c), "members": list(c)[:20]} for c in comps[:5]]

    # influential nodes by degree
    degree_sorted = sorted(g.degree(), key=lambda x: -x[1])[:10]
    top_influential = [{"node": n, "degree": d} for n, d in degree_sorted]

    return {"communities": top_communities, "influential": top_influential}


@router.get("/timeline/summary")
async def timeline_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(func.coalesce(TimelineEvent.year, 0).label("year"), func.count(TimelineEvent.id)).filter(TimelineEvent.user_id == current_user.id).group_by("year").order_by("year").all()
    return [{"year": int(r[0]), "count": int(r[1])} for r in rows]


# ==================== SHARING & COLLABORATION ====================

@router.post("/shares/create", response_model=ShareResponse)
async def create_share(
    payload: CreateShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a shareable link for a memory (public or private)."""
    memory = db.query(Memory).filter(Memory.id == payload.memory_id, Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    share = Share(
        user_id=current_user.id,
        memory_id=payload.memory_id,
        is_public=payload.is_public,
        allow_download=payload.allow_download,
        expires_at=payload.expires_at,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    
    log_usage(db, current_user.id, "create_share", "memory", payload.memory_id)
    
    return ShareResponse(
        share_id=share.id,
        share_token=share.share_token,
        memory_id=share.memory_id,
        is_public=share.is_public,
        allow_download=share.allow_download,
        expires_at=share.expires_at,
        created_at=share.created_at,
        share_link=f"/share/{share.share_token}",
    )


@router.get("/shares/list")
async def list_shares(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all shares created by the user."""
    shares = db.query(Share).filter(Share.user_id == current_user.id).order_by(Share.created_at.desc()).all()
    return {
        "shares": [
            {
                "share_id": s.id,
                "share_token": s.share_token,
                "memory_id": s.memory_id,
                "is_public": s.is_public,
                "allow_download": s.allow_download,
                "view_count": s.view_count,
                "expires_at": s.expires_at,
                "created_at": s.created_at,
                "share_link": f"/share/{s.share_token}",
            }
            for s in shares
        ]
    }


@router.get("/share/{share_token}")
async def access_shared_memory(share_token: str, db: Session = Depends(get_db)):
    """Access a shared memory (public endpoint, no auth required)."""
    share = db.query(Share).filter(Share.share_token == share_token).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    if share.expires_at and share.expires_at < datetime.now(datetime.now().astimezone().tzinfo):
        raise HTTPException(status_code=410, detail="Share has expired")
    
    if not share.is_public:
        raise HTTPException(status_code=403, detail="This share is private")
    
    memory = db.query(Memory).filter(Memory.id == share.memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    share.view_count += 1
    db.commit()
    
    return {
        "memory_id": memory.id,
        "title": memory.title,
        "summary": memory.summary,
        "structured_data": memory.structured_data,
        "metadata_json": memory.metadata_json,
        "raw_text": memory.raw_text if share.allow_download else "[Content hidden - owner disabled downloads]",
        "created_at": memory.created_at,
    }


@router.delete("/shares/{share_id}")
async def delete_share(
    share_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a share link."""
    share = db.query(Share).filter(Share.id == share_id, Share.user_id == current_user.id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    db.delete(share)
    db.commit()
    
    return {"message": "Share deleted successfully"}


# ==================== EXPORT FUNCTIONALITY ====================

@router.get("/export/json")
async def export_json(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export all memories as JSON."""
    rows = db.query(Memory).filter(Memory.user_id == current_user.id).all()
    data = {
        "exported_at": datetime.utcnow().isoformat(),
        "memories": [
            {
                "id": r.id,
                "title": r.title,
                "summary": r.summary,
                "raw_text": r.raw_text,
                "structured_data": r.structured_data,
                "metadata": r.metadata_json,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
            }
            for r in rows
        ],
    }
    
    log_usage(db, current_user.id, "export", "memories", "json")
    
    return StreamingResponse(
        io.StringIO(json.dumps(data, indent=2)),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=memories_export.json"},
    )


@router.get("/export/csv")
async def export_csv_updated(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export memories as CSV (enhanced)."""
    rows = db.query(Memory).filter(Memory.user_id == current_user.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Summary", "Created", "Updated", "People", "Places", "Events"])
    
    for r in rows:
        people = ",".join(r.structured_data.get("people", []))
        places = ",".join(r.structured_data.get("places", []))
        events = ",".join(r.structured_data.get("events", []))
        writer.writerow([
            r.id,
            r.title,
            r.summary,
            r.created_at.isoformat(),
            r.updated_at.isoformat(),
            people,
            places,
            events,
        ])
    
    output.seek(0)
    log_usage(db, current_user.id, "export", "memories", "csv")
    
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=memories.csv"})


@router.get("/export/pdf")
async def export_pdf(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export memories as PDF."""
    rows = db.query(Memory).filter(Memory.user_id == current_user.id).all()
    try:
        pdf_bytes = export_service.export_pdf(rows, user_name=current_user.full_name or current_user.email)
        log_usage(db, current_user.id, "export", "memories", "pdf")
        return StreamingResponse(
            io.BytesIO(pdf_bytes.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=memories_export.pdf"},
        )
    except ImportError:
        raise HTTPException(status_code=501, detail="PDF export is not available (reportlab not installed)")


# ==================== USAGE & LIMITS ====================

def log_usage(db: Session, user_id: str, action: str, resource_type: str, resource_id: str = None, metadata: dict = None):
    """Log user activity for usage tracking."""
    log = UsageLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata_json=metadata or {},
    )
    db.add(log)
    try:
        db.commit()
    except Exception:
        pass  # Don't fail requests if logging fails


@router.get("/usage/stats", response_model=UsageStatsResponse)
async def get_usage_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's current usage statistics."""
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    memories_count = db.query(Memory).filter(Memory.user_id == current_user.id).count()
    
    today = datetime.utcnow().date()
    today_start = datetime(today.year, today.month, today.day)
    today_end = today_start + timedelta(days=1)
    
    daily_uploads = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.action == "upload",
        UsageLog.created_at >= today_start,
        UsageLog.created_at < today_end,
    ).count()
    
    daily_queries = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.action.in_(["chat", "time-machine"]),
        UsageLog.created_at >= today_start,
        UsageLog.created_at < today_end,
    ).count()
    
    # Define tier limits
    tier_limits = {
        "free": {"daily_uploads": 10, "daily_queries": 50},
        "pro": {"daily_uploads": 100, "daily_queries": 500},
        "team": {"daily_uploads": 500, "daily_queries": 2000},
    }
    
    limits = tier_limits.get(sub.plan, tier_limits["free"])
    
    return UsageStatsResponse(
        plan=sub.plan,
        current_storage_bytes=sub.current_storage_bytes,
        storage_limit_mb=sub.storage_limit_mb,
        memories_count=memories_count,
        daily_uploads=daily_uploads,
        daily_upload_limit=limits["daily_uploads"],
        daily_queries=daily_queries,
        daily_query_limit=limits["daily_queries"],
    )


@router.post("/usage/check-limit")
async def check_usage_limit(
    action: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if user is within daily limits for an action."""
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    tier_limits = {
        "free": {"upload": 10, "query": 50},
        "pro": {"upload": 100, "query": 500},
        "team": {"upload": 500, "query": 2000},
    }
    
    limit = tier_limits.get(sub.plan, tier_limits["free"]).get(action, 0)
    
    today = datetime.utcnow().date()
    today_start = datetime(today.year, today.month, today.day)
    today_end = today_start + timedelta(days=1)
    
    count = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.action == action,
        UsageLog.created_at >= today_start,
        UsageLog.created_at < today_end,
    ).count()
    
    return {
        "action": action,
        "plan": sub.plan,
        "current_usage": count,
        "limit": limit,
        "remaining": max(0, limit - count),
        "within_limit": count < limit,
    }
