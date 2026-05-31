from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.responses import JSONResponse, StreamingResponse
import io
import csv
import networkx as nx
import json
import re
import secrets
from urllib.parse import quote, unquote
from datetime import datetime, timedelta, timezone

from app.db import get_db
from app.models.auth import TokenResponse, UserCreate, UserLogin, UserRead
from app.models.database import (
    ContactMessage,
    EmailLog,
    FamilyRelationship,
    FamilyTreeShare,
    FeedbackEntry,
    FamilyArchiveAccess,
    ArchiveInsightAction,
    InviteLink,
    LegacyAchievement,
    LegacyContact,
    LifeMapSnapshot,
    Memory,
    MemoryCapsule,
    PersonProfile,
    ReportRecipient,
    Relationship,
    Share,
    Storybook,
    StoryMessage,
    StorySession,
    FamilyRitual,
    OneLifeStoryShare,
    Subscription,
    TimelineEvent,
    UsageLog,
    User,
    WeeklyReport,
    Media,
    Session as SessionModel,
)
from app.models.memory import ChatRequest, MemoryStatusResponse, MemoryUploadResponse, TimeMachineRequest, ShareResponse, CreateShareRequest, UsageStatsResponse
from app.services.auth import auth_service, bearer_scheme, get_current_user
from app.services.auth_cookies import ACCESS_COOKIE, REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from app.services.ai_provider import ai_provider
from app.services.chat_service import ChatService
from app.services.memory import MemoryService
from app.services.memory_proof import memory_proof_payload, proofs_for_memory_ids
from app.services.archive_intelligence import analyze_archive
from app.services.email_service import EmailService
import os
import uuid
from app.services.rate_limit import rate_limit
from app.services.usage_limits import assert_can_query, assert_can_upload
from app.services.timeline_service import TimelineService
from app.services.time_machine import TimeMachineService
from app.services.export_service import export_service

router = APIRouter()

memory_service = MemoryService()
chat_service = ChatService(memory_service)
timeline_service = TimelineService(memory_service)
time_machine_service = TimeMachineService(memory_service)


def session_status_response(session: SessionModel, user: User) -> JSONResponse:
    access_max, refresh_max = auth_service.cookie_max_ages(session)
    response = JSONResponse(
        content={
            "authenticated": True,
            "access_token": session.token,
            "user": auth_service.to_user_read(user).model_dump(),
        }
    )
    set_auth_cookies(
        response,
        session.token,
        session.refresh_token or "",
        access_max,
        refresh_max,
    )
    return response


def session_auth_response(session: SessionModel, user: User) -> JSONResponse:
    access_max, refresh_max = auth_service.cookie_max_ages(session)
    body = TokenResponse(access_token=session.token, user=auth_service.to_user_read(user)).model_dump()
    response = JSONResponse(content=body)
    set_auth_cookies(
        response,
        session.token,
        session.refresh_token or "",
        access_max,
        refresh_max,
    )
    return response


def active_memories_query(db: Session, user_id: str):
    return db.query(Memory).filter(Memory.user_id == user_id, Memory.deleted_at.is_(None))


def structured_list(memory: Memory, key: str) -> list[str]:
    data = memory.structured_data or {}
    values = data.get(key, []) if isinstance(data, dict) else []
    return [str(value) for value in values if value]


def create_weekly_report_payload(db: Session, user: User) -> dict:
    rows = active_memories_query(db, user.id).filter(Memory.archived_at.is_(None)).order_by(Memory.created_at.desc()).limit(24).all()
    relationships = db.query(Relationship).filter(Relationship.user_id == user.id).count()
    years = [
        int(row[0])
        for row in db.query(TimelineEvent.year)
        .filter(TimelineEvent.user_id == user.id, TimelineEvent.year.isnot(None))
        .distinct()
        .order_by(TimelineEvent.year)
        .all()
    ]
    people: dict[str, int] = {}
    places: dict[str, int] = {}
    for memory in rows:
        for person in structured_list(memory, "people"):
            people[person] = people.get(person, 0) + 1
        for place in structured_list(memory, "places"):
            places[place] = places.get(place, 0) + 1

    top_people = [item[0] for item in sorted(people.items(), key=lambda item: -item[1])[:5]]
    top_places = [item[0] for item in sorted(places.items(), key=lambda item: -item[1])[:5]]
    highlights = [
        {"title": memory.title, "summary": memory.summary or (memory.raw_text or "")[:180]}
        for memory in rows[:6]
    ]
    subject = "Your MemoryGraph weekly family letter"
    greeting = user.full_name or user.email.split("@")[0]
    body_lines = [
        f"Hi {greeting},",
        "",
        f"This week your archive contains {len(rows)} active memories connected by {relationships} relationships.",
        f"Timeline coverage: {years[0]}-{years[-1]}." if years else "Timeline coverage is still forming as more memories are added.",
    ]
    if top_people:
        body_lines.append(f"People who appeared most: {', '.join(top_people)}.")
    if top_places:
        body_lines.append(f"Places that shaped the archive: {', '.join(top_places)}.")
    if highlights:
        body_lines.extend(["", "New memory highlights:"])
        body_lines.extend([f"- {item['title']}: {item['summary']}" for item in highlights[:4]])
    body_lines.extend(["", "MemoryGraph keeps turning scattered files into a living family story."])
    body = "\n".join(body_lines)
    return {
        "subject": subject,
        "body": body,
        "summary": {
            "memory_count": len(rows),
            "relationship_count": relationships,
            "timeline_years": years,
            "top_people": top_people,
            "top_places": top_places,
            "highlights": highlights,
        },
        "mailto": f"mailto:?subject={quote(subject)}&body={quote(body)}",
    }


def memory_people(memory: Memory) -> list[str]:
    return structured_list(memory, "people")


def memories_for_person(db: Session, user_id: str, person_name: str, limit: int = 12) -> list[Memory]:
    like = f"%{person_name.lower()}%"
    return (
        active_memories_query(db, user_id)
        .filter(Memory.archived_at.is_(None))
        .filter(
            Memory.raw_text.ilike(like)
            | Memory.summary.ilike(like)
            | Memory.title.ilike(like)
        )
        .order_by(Memory.updated_at.desc())
        .limit(limit)
        .all()
    )


def memory_card(memory: Memory) -> dict:
    return {
        "memory_id": memory.id,
        "title": memory.title,
        "summary": memory.summary,
        "raw_text": (memory.raw_text or "")[:240],
        "structured_data": memory.structured_data or {},
        "created_at": memory.created_at.isoformat() if memory.created_at else None,
        "updated_at": memory.updated_at.isoformat() if memory.updated_at else None,
    }


def build_people_index(db: Session, user_id: str) -> list[dict]:
    rows = active_memories_query(db, user_id).filter(Memory.archived_at.is_(None)).all()
    people: dict[str, dict] = {}
    for memory in rows:
        data = memory.structured_data or {}
        for name in data.get("people", []) if isinstance(data, dict) else []:
            person = people.setdefault(
                name,
                {"id": quote(name, safe=""), "name": name, "memory_count": 0, "places": set(), "years": set(), "events": set(), "latest_summary": ""},
            )
            person["memory_count"] += 1
            person["latest_summary"] = person["latest_summary"] or memory.summary
            for place in data.get("places", []):
                person["places"].add(place)
            for event in data.get("events", []):
                person["events"].add(event)
            for date_value in data.get("dates", []):
                if isinstance(date_value, str):
                    for year in re.findall(r"\b(19\d{2}|20\d{2})\b", date_value):
                        person["years"].add(year)
    profiles = {profile.name: profile for profile in db.query(PersonProfile).filter(PersonProfile.user_id == user_id).all()}
    result = []
    for person in people.values():
        profile = profiles.get(person["name"])
        result.append(
            {
                **person,
                "role": profile.role if profile else infer_role(person["name"]),
                "biography": profile.biography if profile else f"{person['name']} appears across {person['memory_count']} memories in this archive.",
                "places": sorted(person["places"])[:8],
                "years": sorted(person["years"])[:12],
                "events": sorted(person["events"])[:8],
            }
        )
    return sorted(result, key=lambda item: (-item["memory_count"], item["name"]))


def infer_role(name: str) -> str:
    lowered = name.lower()
    if "father" in lowered or "dad" in lowered:
        return "Father"
    if "grandfather" in lowered or "grandpa" in lowered:
        return "Grandfather"
    if "mother" in lowered or "mom" in lowered:
        return "Mother"
    return "Family"


def next_story_question(mode: str, answer: str, count: int) -> str:
    prompts = {
        "Childhood": ["What did home feel like when you were young?", "Who shaped those early years the most?", "Which childhood place still feels vivid?"],
        "Family": ["Who should your family understand better?", "What tradition says the most about this family?", "Which relationship changed you?"],
        "Places": ["Which place still carries the strongest memory?", "What happened there that your family should remember?", "Who was with you in that place?"],
        "Career": ["What was a turning point in your work life?", "Who helped you during that period?", "What lesson would you pass on?"],
        "Love": ["When did you first feel deeply loved or seen?", "What small moment still makes you smile?", "Who needs to hear that story?"],
        "Loss": ["What do you wish people remembered about that time?", "Who helped you through it?", "What meaning stayed with you?"],
        "Advice": ["What advice would you give the next generation?", "What mistake taught you the most?", "Which value matters most to preserve?"],
        "Legacy": ["What story should never be lost?", "Who is at the center of that story?", "What should your family understand about why it mattered?"],
    }
    if answer and len(answer.split()) > 16 and count % 2 == 0:
        return "What detail from that memory would make it feel alive to someone who was not there?"
    choices = prompts.get(mode, prompts["Legacy"])
    return choices[min(count, len(choices) - 1)]


def compute_legacy_payload(db: Session, user_id: str) -> dict:
    memories = active_memories_query(db, user_id).filter(Memory.archived_at.is_(None)).count()
    relationships = db.query(Relationship).filter(Relationship.user_id == user_id).count() + db.query(FamilyRelationship).filter(FamilyRelationship.user_id == user_id).count()
    years = db.query(TimelineEvent.year).filter(TimelineEvent.user_id == user_id, TimelineEvent.year.isnot(None)).distinct().count()
    sessions = db.query(StorySession).filter(StorySession.user_id == user_id).count()
    reports = db.query(WeeklyReport).filter(WeeklyReport.user_id == user_id).count()
    storybooks = db.query(Storybook).filter(Storybook.user_id == user_id).count()
    people = len(build_people_index(db, user_id))
    score = min(100, memories * 3 + relationships + years * 4 + sessions * 8 + reports * 6 + storybooks * 8)
    badges = [
        {"key": "first_memory", "title": "First memory", "earned": memories >= 1},
        {"key": "family_thread", "title": "Family thread", "earned": people >= 3},
        {"key": "ten_years", "title": "Ten years mapped", "earned": years >= 10},
        {"key": "weekly_letter", "title": "Weekly letter", "earned": reports >= 1},
        {"key": "storybook", "title": "Storybook created", "earned": storybooks >= 1},
        {"key": "relationship_web", "title": "Relationship web", "earned": relationships >= 50},
    ]
    for badge in badges:
        if badge["earned"]:
            existing = db.query(LegacyAchievement).filter(LegacyAchievement.user_id == user_id, LegacyAchievement.achievement_key == badge["key"]).first()
            if not existing:
                db.add(LegacyAchievement(user_id=user_id, achievement_key=badge["key"], title=badge["title"], metadata_json={}))
    db.commit()
    next_action = "Add a story through Story Companion"
    if memories == 0:
        next_action = "Open the sample archive or add the first memory"
    elif reports == 0:
        next_action = "Generate a weekly family letter"
    elif storybooks == 0:
        next_action = "Create an illustrated storybook"
    return {
        "score": score,
        "stage": "Redwood" if score >= 85 else "Oak" if score >= 65 else "Maple" if score >= 40 else "Sapling",
        "inputs": {"memories": memories, "relationships": relationships, "years": years, "people": people, "story_sessions": sessions, "reports": reports, "storybooks": storybooks},
        "badges": badges,
        "next_action": next_action,
    }


def build_memory_dna(db: Session, user_id: str, person_name: str) -> dict:
    memories = memories_for_person(db, user_id, person_name, limit=24)
    text = " ".join(f"{memory.title} {memory.summary} {memory.raw_text}" for memory in memories).lower()
    value_map = {
        "Family": ["family", "father", "mother", "grandfather", "home", "children"],
        "Service": ["service", "army", "navy", "veteran", "duty", "unit"],
        "Learning": ["school", "college", "study", "professor", "education", "research"],
        "Resilience": ["hard", "loss", "alone", "moved", "struggle", "rebuilt"],
        "Adventure": ["travel", "vacation", "mumbai", "moab", "journey", "trip"],
        "Love": ["love", "married", "wedding", "grateful", "proud"],
    }
    values = [label for label, keywords in value_map.items() if any(keyword in text for keyword in keywords)]
    places: dict[str, int] = {}
    people: dict[str, int] = {}
    years: set[str] = set()
    events: set[str] = set()
    for memory in memories:
        data = memory.structured_data or {}
        if not isinstance(data, dict):
            continue
        for place in data.get("places", []):
            places[place] = places.get(place, 0) + 1
        for person in data.get("people", []):
            if person != person_name:
                people[person] = people.get(person, 0) + 1
        for event in data.get("events", []):
            events.add(event)
        for date_value in data.get("dates", []):
            if isinstance(date_value, str):
                years.update(re.findall(r"\b(19\d{2}|20\d{2})\b", date_value))
    phases = []
    sorted_years = sorted(years)
    if sorted_years:
        phases.append({"label": "Early archive signals", "years": sorted_years[:3]})
        phases.append({"label": "Later archive signals", "years": sorted_years[-3:]})
    return {
        "person": person_name,
        "core_values": values or ["Family", "Memory", "Legacy"],
        "recurring_places": sorted(places, key=places.get, reverse=True)[:6],
        "important_people": sorted(people, key=people.get, reverse=True)[:6],
        "emotional_themes": sorted(events)[:8] or ["Life chapter", "Relationship memory"],
        "life_phases": phases,
        "what_shaped_them": f"{person_name} is shaped in this archive by {', '.join((values or ['family memory'])[:3])}.",
        "source_count": len(memories),
        "proof": [memory_proof_payload(memory) for memory in memories[:6]],
    }


def build_biography_html(user: User, title: str, chapters: list[dict], people: list[dict]) -> str:
    chapter_html = "".join(
        f"<section><h2>{chapter['title']}</h2><p>{chapter['narrative']}</p><ul>{''.join(f'<li>{source}</li>' for source in chapter.get('sources', []))}</ul></section>"
        for chapter in chapters
    )
    people_html = "".join(f"<li>{person['name']} - {person.get('role', 'Family')}</li>" for person in people[:12])
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>
<style>body{{font-family:Georgia,serif;background:#f6f1e8;color:#111827;padding:48px;line-height:1.7}}main{{max-width:860px;margin:auto;background:white;padding:44px;border:1px solid #e6d7b8;border-radius:18px}}h1{{font-size:48px}}h2{{font-size:28px;margin-top:36px}}</style></head>
<body><main><p>MemoryGraph Biography</p><h1>{title}</h1><p>Prepared for {user.full_name or user.email}</p><h2>People in this life story</h2><ul>{people_html}</ul>{chapter_html}</main></body></html>"""


def build_life_map_payload(db: Session, user_id: str, person: str | None = None) -> dict:
    rows = active_memories_query(db, user_id).filter(Memory.archived_at.is_(None)).order_by(Memory.created_at.desc()).limit(80).all()
    if person:
        needle = person.lower()
        rows = [row for row in rows if needle in f"{row.title} {row.summary} {row.raw_text}".lower()]
    buckets = {
        "Childhood": ["child", "school", "home", "young"],
        "Education": ["college", "study", "class", "professor", "education"],
        "Career": ["work", "career", "business", "job", "office"],
        "Family": ["family", "father", "mother", "wedding", "children", "grandfather"],
        "Places": ["mumbai", "house", "city", "trip", "vacation", "moved"],
        "Service": ["army", "navy", "air force", "service", "veteran", "duty"],
        "Milestones": ["first", "graduated", "married", "bought", "started"],
        "Legacy": ["remember", "lesson", "grateful", "proud", "legacy"],
    }
    categories = []
    used_memory_ids: set[str] = set()
    for label, keywords in buckets.items():
        matches = [
            memory
            for memory in rows
            if any(keyword in f"{memory.title} {memory.summary} {memory.raw_text}".lower() for keyword in keywords)
        ][:8]
        if not matches and label in {"Family", "Legacy"}:
            matches = rows[:4]
        for memory in matches:
            used_memory_ids.add(memory.id)
        categories.append(
            {
                "label": label,
                "count": len(matches),
                "nodes": [
                    {
                        "memory_id": memory.id,
                        "title": memory.title,
                        "summary": memory.summary or (memory.raw_text or "")[:160],
                        "proof": memory_proof_payload(memory),
                    }
                    for memory in matches
                ],
            }
        )
    return {
        "title": f"{person or 'Family'} Life Map",
        "person": person,
        "categories": categories,
        "source_memory_ids": sorted(used_memory_ids),
    }


def build_family_tree_payload(db: Session, user_id: str) -> dict:
    people = build_people_index(db, user_id)
    relationships = db.query(FamilyRelationship).filter(FamilyRelationship.user_id == user_id).order_by(FamilyRelationship.created_at.desc()).all()
    profiles = {profile.name: profile for profile in db.query(PersonProfile).filter(PersonProfile.user_id == user_id).all()}
    return {
        "people": [
            {
                **person,
                "photo_url": (profiles.get(person["name"]).metadata_json or {}).get("photo_url") if profiles.get(person["name"]) else None,
                "birth_year": (profiles.get(person["name"]).metadata_json or {}).get("birth_year") if profiles.get(person["name"]) else None,
                "notes": (profiles.get(person["name"]).metadata_json or {}).get("notes") if profiles.get(person["name"]) else None,
            }
            for person in people
        ],
        "relationships": [
            {"person_a": row.person_a, "relation": row.relation, "person_b": row.person_b, "notes": row.notes}
            for row in relationships
        ],
    }


@router.get("/health")
async def health():
    try:
        ai = ai_provider.status()
        ai_summary = {"provider": ai.get("provider"), "reachable": ai.get("reachable")}
    except Exception:
        ai_summary = {"provider": "unknown", "reachable": False}
    return {
        "status": "ok",
        "service": "MemoryGraph",
        "ai": ai_summary,
    }


@router.get("/ai/status")
async def ai_status():
    return ai_provider.status()


@router.post("/contact")
async def save_contact_message(payload: dict, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "public-contact", limit=20)
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    message = str(payload.get("message", "")).strip()
    reason = str(payload.get("reason", "General")).strip() or "General"
    if not name or not email or not message:
        raise HTTPException(status_code=400, detail="Name, email, and message are required")
    contact = ContactMessage(
        name=name[:200],
        email=email[:320],
        reason=reason[:120],
        message=message,
        metadata_json={"source": "marketing_contact"},
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return {"success": True, "message": "Message saved", "contact_id": contact.id}


@router.post("/feedback")
async def save_feedback(payload: dict, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "public-feedback", limit=30)
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=400, detail="Feedback message is required")
    feedback = FeedbackEntry(
        email=str(payload.get("email", "")).strip().lower()[:320] or None,
        usefulness=str(payload.get("usefulness", "Useful with improvements")).strip()[:100],
        feedback_type=str(payload.get("feedback_type", "Feature request")).strip()[:100],
        standout_experience=str(payload.get("standout_experience", "")).strip()[:150] or None,
        message=message,
        metadata_json={"source": "feedback_page"},
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {"success": True, "message": "Feedback saved", "feedback_id": feedback.id}


@router.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "auth", limit=10)
    user = auth_service.create_user(db, payload.email, payload.password, payload.full_name)
    from app.services.referral_service import record_referral_signup

    record_referral_signup(db, user.id, payload.referral_code)
    session = auth_service.create_session_pair(user.id, db)
    return session_auth_response(session, user)


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "auth", limit=10)
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    session = auth_service.create_session_pair(user.id, db)
    return session_auth_response(session, user)


@router.get("/auth/session")
async def auth_session(
    credentials=Depends(bearer_scheme),
    access_cookie: str | None = Cookie(None, alias=ACCESS_COOKIE),
    refresh_cookie: str | None = Cookie(None, alias=REFRESH_COOKIE),
    db: Session = Depends(get_db),
):
    """Always 200 — avoids noisy 401s in the browser when logged out."""
    token = credentials.credentials if credentials else access_cookie
    if token:
        session = auth_service.resolve_session_from_access_token(token, db)
        if session:
            user = db.get(User, session.user_id)
            if user and user.is_active:
                return session_status_response(session, user)

    if refresh_cookie:
        session = auth_service.refresh_access_token(refresh_cookie, db)
        if session:
            user = db.get(User, session.user_id)
            if user and user.is_active:
                return session_status_response(session, user)

    return JSONResponse({"authenticated": False, "user": None})


@router.post("/auth/refresh")
async def refresh_session(
    refresh_cookie: str | None = Cookie(None, alias=REFRESH_COOKIE),
    db: Session = Depends(get_db),
):
    if not refresh_cookie:
        return JSONResponse({"authenticated": False, "detail": "No refresh token"}, status_code=401)
    session = auth_service.refresh_access_token(refresh_cookie, db)
    if not session:
        response = JSONResponse({"authenticated": False, "detail": "Invalid or expired refresh token"}, status_code=401)
        clear_auth_cookies(response)
        return response
    user = db.get(User, session.user_id)
    if not user or not user.is_active:
        response = JSONResponse({"authenticated": False, "detail": "Invalid refresh token"}, status_code=401)
        clear_auth_cookies(response)
        return response
    return session_status_response(session, user)


@router.get("/auth/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return auth_service.to_user_read(current_user)


@router.get("/auth/export-data")
async def export_account_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """GDPR-style export of the authenticated user's archive."""
    rows = active_memories_query(db, current_user.id).all()
    memories_json = export_service.export_json(rows)
    memories_json.seek(0)
    data = json.loads(memories_json.read())
    payload = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": auth_service.to_user_read(current_user).model_dump(),
        "memories": data.get("memories", []),
    }
    log_usage(db, current_user.id, "export", "account", "gdpr")
    return payload


@router.delete("/auth/account")
async def delete_account(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    password = str(payload.get("password", ""))
    if current_user.auth_method == "email":
        if not current_user.hashed_password or not auth_service.verify_password(password, current_user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid password")

    now = datetime.now(timezone.utc)
    db.query(SessionModel).filter(SessionModel.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Memory).filter(Memory.user_id == current_user.id, Memory.deleted_at.is_(None)).update(
        {"deleted_at": now, "delete_reason": "account_deleted", "updated_at": now},
        synchronize_session=False,
    )
    current_user.email = f"deleted-{current_user.id[:8]}@deleted.memorygraph"
    current_user.full_name = None
    current_user.is_active = False
    current_user.hashed_password = auth_service.hash_password(secrets.token_urlsafe(32))
    current_user.updated_at = now
    db.commit()

    response = JSONResponse({"success": True, "message": "Account deleted"})
    clear_auth_cookies(response)
    return response


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
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to send OTP"))

    return {
        "success": True,
        "message": result.get("message"),
        "expires_in_minutes": result.get("expires_in_minutes"),
        "dev_mode": result.get("dev_mode", False),
    }


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
    
    # Create session
    session = auth_service.create_session_pair(user.id, db)

    return session_auth_response(session, user)


@router.post("/auth/google/callback")
async def google_callback(payload: dict, request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    from app.services.google_auth import GoogleAuthService
    from app.services.email_service import EmailService
    from app.services.otp_service import OTPService
    
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
    
    if user.email_verified and not is_new:
        session = auth_service.create_session_pair(user.id, db)
        return session_auth_response(session, user)

    otp_result = OTPService.create_and_send_otp(user.id, email, db)

    if not otp_result.get("success"):
        raise HTTPException(status_code=500, detail=otp_result.get("message"))

    return {
        "requires_otp": True,
        "email": email,
        "message": "Verification code sent to your email",
        "expires_in_minutes": otp_result.get("expires_in_minutes"),
        "user": auth_service.to_user_read(user),
    }


@router.post("/auth/logout")
async def logout(
    credentials=Depends(bearer_scheme),
    access_cookie: str | None = Cookie(None, alias=ACCESS_COOKIE),
    refresh_cookie: str | None = Cookie(None, alias=REFRESH_COOKIE),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Logout user and invalidate the current database-backed session."""
    access = credentials.credentials if credentials else access_cookie
    auth_service.revoke_session(db, access_token=access, refresh_token=refresh_cookie)
    response = JSONResponse({"success": True, "message": "Logged out successfully"})
    clear_auth_cookies(response)
    return response


@router.post("/memories/upload")
async def upload_and_process_memory(
    background_tasks: BackgroundTasks,
    request: Request,
    file: UploadFile = File(...),
    archive_owner_id: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemoryUploadResponse:
    try:
        from app.services.archive_access import assert_can_access_archive

        rate_limit(request, f"upload:{current_user.id}", limit=20)
        assert_can_upload(db, current_user.id)
        target_user_id = current_user.id
        if archive_owner_id and archive_owner_id != current_user.id:
            assert_can_access_archive(db, current_user.id, archive_owner_id)
            target_user_id = archive_owner_id

        # Save upload and create pending memory record
        memory = await memory_service.create_pending_memory(file, target_user_id, db)

        # Determine incoming size from stored metadata (safe fallback to 0)
        incoming_size = 0
        try:
            incoming_size = int((memory.metadata_json or {}).get("file_size", 0))
        except Exception:
            incoming_size = 0

        # Enforce subscription storage limits after saving (cleanup if exceeded)
        archive_owner = db.get(User, target_user_id)
        subscription = archive_owner.subscription if archive_owner else current_user.subscription
        if subscription and subscription.current_storage_bytes + incoming_size > subscription.storage_limit_mb * 1024 * 1024:
            # Remove saved media and memory record to respect limits
            try:
                db.query(Media).filter(Media.memory_id == memory.id, Media.user_id == target_user_id).delete()
                db.delete(memory)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=402, detail="Storage limit reached for current plan")

        log_usage(
            db,
            current_user.id,
            "upload",
            "memory",
            memory.id,
            {
                "filename": memory.title or file.filename,
                "size": incoming_size,
                "archive_owner_id": target_user_id,
                "contributor_upload": target_user_id != current_user.id,
            },
        )
        background_tasks.add_task(memory_service.process_memory_job, memory.id, target_user_id)
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
    owner_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
    status: str | None = None,
    person: str | None = None,
    year: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        from app.services.archive_access import assert_can_access_archive

        target_user_id = current_user.id
        if owner_id and owner_id != current_user.id:
            assert_can_access_archive(db, current_user.id, owner_id)
            target_user_id = owner_id
        records = memory_service.list_memories(db=db, user_id=target_user_id)
        if status:
            records = [r for r in records if r.status == status]
        if person:
            needle = person.lower()
            records = [
                r
                for r in records
                if needle in (r.structured_data.summary or "").lower()
                or needle in (r.raw_text or "").lower()
                or any(needle in p.lower() for p in (r.structured_data.people or []))
            ]
        if year:
            records = [
                r
                for r in records
                if year in (r.raw_text or "")
                or year in (r.structured_data.summary or "")
                or any(year in str(d) for d in (r.structured_data.dates or []))
            ]
        total = len(records)
        page = records[offset : offset + min(max(limit, 1), 200)]
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "memories": [
                {
                    "memory_id": r.memory_id,
                    "title": r.metadata.original_filename if r.metadata else "Untitled",
                    "summary": r.structured_data.summary if r.structured_data else r.raw_text[:100] if r.raw_text else "",
                    "raw_text": r.raw_text[:200] if r.raw_text else "",
                    "status": r.status,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                }
                for r in page
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memories/search")
async def search_memories(
    query: str,
    limit: int = 24,
    owner_id: str | None = None,
    person: str | None = None,
    year: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.archive_access import assert_can_access_archive

    target_user_id = current_user.id
    if owner_id and owner_id != current_user.id:
        assert_can_access_archive(db, current_user.id, owner_id)
        target_user_id = owner_id
    records = memory_service.search_memories(db, target_user_id, query, limit=min(limit, 50))
    if person:
        needle = person.lower()
        records = [
            r
            for r in records
            if any(needle in p.lower() for p in (r.structured_data.people or []))
            or needle in (r.structured_data.summary or "").lower()
        ]
    if year:
        records = [
            r
            for r in records
            if year in (r.raw_text or "")
            or any(year in str(d) for d in (r.structured_data.dates or []))
        ]
    return {"results": [record.model_dump(mode="json") for record in records]}


@router.get("/memories/insights")
async def memories_insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return lightweight AI insights: summaries, simple duplicate detection, and top people."""
    rows = active_memories_query(db, current_user.id).filter(Memory.archived_at.is_(None)).all()
    summaries = [
        {
            "memory_id": r.id,
            "title": getattr(r, "title", ""),
            "summary": getattr(r, "summary", "") or (r.structured_data.get("summary") if getattr(r, "structured_data", None) else ""),
        }
        for r in rows
    ]

    groups: dict[str, list[str]] = {}
    for r in rows:
        key = (getattr(r, "raw_text", "") or "")[:200]
        groups.setdefault(key, []).append(r.id)
    duplicates = [g for g in groups.values() if len(g) > 1]

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
        for person in people:
            top_people[person] = top_people.get(person, 0) + 1

    top_people_list = sorted(top_people.items(), key=lambda item: -item[1])[:10]

    return {"count": len(rows), "summaries": summaries, "duplicates": duplicates, "top_people": top_people_list}


@router.get("/memories/{memory_id}")
async def get_memory(
    memory_id: str,
    owner_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.archive_access import assert_can_access_archive

    target_user_id = current_user.id
    if owner_id and owner_id != current_user.id:
        assert_can_access_archive(db, current_user.id, owner_id)
        target_user_id = owner_id
    record = memory_service.get_memory(db, memory_id, target_user_id)
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


@router.post("/memories/{memory_id}/archive")
async def archive_memory(memory_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id, Memory.deleted_at.is_(None)).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    memory.archived_at = datetime.now(timezone.utc)
    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "archive", "memory", memory.id)
    return {"success": True, "memory_id": memory.id, "archived_at": memory.archived_at.isoformat()}


@router.post("/memories/{memory_id}/restore")
async def restore_memory(memory_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    memory.archived_at = None
    memory.deleted_at = None
    memory.delete_reason = None
    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "restore", "memory", memory.id)
    return {"success": True, "memory_id": memory.id}


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, payload: dict | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id, Memory.deleted_at.is_(None)).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    memory.deleted_at = datetime.now(timezone.utc)
    memory.delete_reason = (payload or {}).get("reason") if isinstance(payload, dict) else None
    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "delete", "memory", memory.id, {"soft_delete": True})
    return {"success": True, "memory_id": memory.id, "deleted_at": memory.deleted_at.isoformat()}


@router.post("/chat")
async def chat(
    request: ChatRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        rate_limit(http_request, f"chat:{current_user.id}", limit=60)
        assert_can_query(db, current_user.id)
        result = await chat_service.query_memory_graph(request.query, db=db, user_id=current_user.id)
        log_usage(db, current_user.id, "chat", "query", metadata={"query_length": len(request.query)})
        return result
    except HTTPException:
        raise
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
    from app.services.archive_access import assert_can_access_archive

    rate_limit(http_request, f"time-machine:{current_user.id}", limit=30)
    assert_can_query(db, current_user.id)
    target_user_id = current_user.id
    if request.owner_id and request.owner_id != current_user.id:
        assert_can_access_archive(db, current_user.id, request.owner_id)
        target_user_id = request.owner_id
    result = time_machine_service.query(
        db,
        user_id=target_user_id,
        query=request.query,
        birth_year=request.birth_year,
    )
    log_usage(db, current_user.id, "time-machine", "query", metadata={"query_length": len(request.query)})
    return result.model_dump(mode="json")


@router.post("/demo/seed")
async def seed_demo(
    dataset: str | None = "family_archive_flagship",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.demo_seed_service import seed_full_sample_archive

    payload = seed_full_sample_archive(db, current_user.id, dataset_key=dataset or "family_archive_flagship")
    return {"success": True, "created": payload["memories_created"], "extras": payload["extras"]}


@router.post("/sample-archive/load")
async def load_sample_archive(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Product-facing alias for loading the Patel sample family archive."""
    from app.services.demo_seed_service import seed_full_sample_archive

    payload = seed_full_sample_archive(db, current_user.id)
    return {"success": True, "message": "Sample family archive loaded.", **payload}


@router.post("/demo/reset")
async def reset_demo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return memory_service.reset_demo_memories(db, current_user.id)


@router.get("/demo/status")
async def demo_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return memory_service.demo_status(db, current_user.id)


@router.post("/billing/checkout")
async def billing_checkout(current_user: User = Depends(get_current_user)):
    from app.services.billing_service import BillingService

    if not BillingService.configured():
        return {
            "status": "not_configured",
            "message": "Set STRIPE_SECRET_KEY and STRIPE_PRICE_FAMILY to enable checkout.",
            "user_id": current_user.id,
        }
    return BillingService.create_family_checkout(current_user.id, current_user.email)


@router.post("/billing/portal")
async def billing_portal(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.billing_service import BillingService

    sub = current_user.subscription
    customer_id = getattr(sub, "stripe_customer_id", None) if sub else None
    if not customer_id:
        return {
            "status": "not_configured",
            "message": "No Stripe customer linked to this account yet.",
            "user_id": current_user.id,
        }
    return BillingService.create_portal(customer_id)


@router.get("/graph/visualize")
async def visualize_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Relationship).filter(Relationship.user_id == current_user.id).limit(250).all()
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


@router.get("/export/memories")
async def export_memories(format: str = "csv", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export memories as CSV (lightweight)."""
    rows = active_memories_query(db, current_user.id).all()
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
async def graph_insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return simple graph insights: connected components and influential nodes by degree."""
    rows = db.query(Relationship).filter(Relationship.user_id == current_user.id).all()
    g = nx.Graph()
    for row in rows:
        source = f"{row.source_type}:{row.source_id}"
        target = f"{row.target_type}:{row.target_id}"
        g.add_node(source, type=row.source_type, label=row.source_id)
        g.add_node(target, type=row.target_type, label=row.target_id)
        g.add_edge(source, target, relation=row.relation)

    if g is None or len(g.nodes) == 0:
        return {"communities": [], "influential": []}

    # connected components (largest first)
    comps = sorted(nx.connected_components(g), key=lambda c: -len(c))
    top_communities = [{"size": len(c), "members": list(c)[:20]} for c in comps[:5]]

    # influential nodes by degree
    degree_sorted = sorted(g.degree(), key=lambda x: -x[1])[:10]
    top_influential = [
        {"node": g.nodes[n].get("label", n), "degree": d}
        for n, d in degree_sorted
    ]

    return {"communities": top_communities, "influential": top_influential}


@router.get("/timeline/summary")
async def timeline_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(func.coalesce(TimelineEvent.year, 0).label("year"), func.count(TimelineEvent.id)).filter(TimelineEvent.user_id == current_user.id).group_by("year").order_by("year").all()
    return [{"year": int(r[0]), "count": int(r[1])} for r in rows]


# ==================== FAMILY READINESS ====================

@router.get("/reports/weekly")
async def weekly_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload = create_weekly_report_payload(db, current_user)
    log_usage(db, current_user.id, "generate", "weekly_report")
    return payload


@router.post("/reports/weekly")
async def create_weekly_report(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recipient_type = str(payload.get("recipient_type", "Family Group")).strip() or "Family Group"
    report_payload = create_weekly_report_payload(db, current_user)
    tone_intro = {
        "Parent": "Written with a warm, respectful tone for a parent.",
        "Sibling": "Written like a shared family catch-up for siblings.",
        "Grandchild": "Written simply, with story context for a younger family member.",
        "Family Group": "Written for the whole family to read together.",
    }.get(recipient_type, "Written for the whole family to read together.")
    body = f"{tone_intro}\n\n{report_payload['body']}"
    report = WeeklyReport(
        user_id=current_user.id,
        title=f"{recipient_type} Weekly Family Letter",
        recipient_type=recipient_type,
        subject=report_payload["subject"],
        body=body,
        summary_json=report_payload["summary"],
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    log_usage(db, current_user.id, "create", "weekly_report", report.id)
    return {
        "report_id": report.id,
        "title": report.title,
        "recipient_type": report.recipient_type,
        "subject": report.subject,
        "body": report.body,
        "summary": report.summary_json,
        "created_at": report.created_at.isoformat(),
    }


@router.get("/reports/weekly/list")
async def list_weekly_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(WeeklyReport).filter(WeeklyReport.user_id == current_user.id).order_by(WeeklyReport.created_at.desc()).limit(12).all()
    return {
        "reports": [
            {
                "report_id": report.id,
                "title": report.title,
                "recipient_type": report.recipient_type,
                "subject": report.subject,
                "body": report.body,
                "summary": report.summary_json,
                "share_token": report.share_token,
                "is_public": report.is_public,
                "created_at": report.created_at.isoformat(),
            }
            for report in reports
        ]
    }


@router.post("/reports/weekly/{report_id}/share")
async def share_weekly_report(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(WeeklyReport).filter(WeeklyReport.id == report_id, WeeklyReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.share_token = report.share_token or secrets.token_urlsafe(24)
    report.is_public = True
    report.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "share", "weekly_report", report.id)
    return {"share_token": report.share_token, "share_link": f"/public/reports/{report.share_token}"}


@router.get("/public/reports/{token}")
async def public_weekly_report(token: str, db: Session = Depends(get_db)):
    report = db.query(WeeklyReport).filter(WeeklyReport.share_token == token, WeeklyReport.is_public == True).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "title": report.title,
        "recipient_type": report.recipient_type,
        "subject": report.subject,
        "body": report.body,
        "summary": report.summary_json,
        "created_at": report.created_at.isoformat(),
    }


@router.post("/report-recipients")
async def create_report_recipient(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and email are required")
    recipient = ReportRecipient(
        user_id=current_user.id,
        name=name[:200],
        email=email[:320],
        relationship=str(payload.get("relationship", "")).strip()[:120] or None,
        cadence=str(payload.get("cadence", "weekly")).strip()[:80] or "weekly",
    )
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    log_usage(db, current_user.id, "create", "report_recipient", recipient.id)
    return {"recipient_id": recipient.id, "name": recipient.name, "email": recipient.email, "relationship": recipient.relationship, "cadence": recipient.cadence, "created_at": recipient.created_at.isoformat()}


@router.get("/report-recipients")
async def list_report_recipients(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recipients = db.query(ReportRecipient).filter(ReportRecipient.user_id == current_user.id).order_by(ReportRecipient.created_at.desc()).all()
    return {"recipients": [{"recipient_id": row.id, "name": row.name, "email": row.email, "relationship": row.relationship, "cadence": row.cadence, "created_at": row.created_at.isoformat()} for row in recipients]}


@router.post("/reports/weekly/{report_id}/send")
async def mark_weekly_report_sent(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(WeeklyReport).filter(WeeklyReport.id == report_id, WeeklyReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    recipients = db.query(ReportRecipient).filter(ReportRecipient.user_id == current_user.id).all()
    if not recipients:
        raise HTTPException(status_code=400, detail="Add at least one report recipient first")
    for recipient in recipients:
        db.add(EmailLog(user_id=current_user.id, recipient_email=recipient.email, subject=report.subject, email_type="weekly_report", status="drafted"))
    db.commit()
    log_usage(db, current_user.id, "send", "weekly_report", report.id, {"recipients": len(recipients)})
    return {"success": True, "status": "drafted", "recipient_count": len(recipients)}


@router.post("/story-sessions")
async def create_story_session(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mode = str(payload.get("mode", "Legacy")).strip() or "Legacy"
    title = str(payload.get("title", f"{mode} Story Session")).strip()[:240] or f"{mode} Story Session"
    question = next_story_question(mode, "", 0)
    session = StorySession(user_id=current_user.id, mode=mode, title=title, next_question=question)
    db.add(session)
    db.commit()
    db.refresh(session)
    log_usage(db, current_user.id, "create", "story_session", session.id)
    return {
        "session_id": session.id,
        "mode": session.mode,
        "title": session.title,
        "status": session.status,
        "next_question": session.next_question,
        "messages": [],
    }


@router.get("/story-sessions")
async def list_story_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(StorySession).filter(StorySession.user_id == current_user.id).order_by(StorySession.updated_at.desc()).limit(12).all()
    return {
        "sessions": [
            {
                "session_id": session.id,
                "mode": session.mode,
                "title": session.title,
                "status": session.status,
                "next_question": session.next_question,
                "summary": session.summary,
                "message_count": len(session.messages),
                "updated_at": session.updated_at.isoformat(),
            }
            for session in sessions
        ]
    }


@router.post("/story-sessions/{session_id}/message")
async def add_story_message(session_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(StorySession).filter(StorySession.id == session_id, StorySession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Story session not found")
    content = str(payload.get("content", "")).strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required")
    extracted = ai_provider.enrich_text(content).model_dump()
    db.add(StoryMessage(session_id=session.id, user_id=current_user.id, role="user", content=content, extracted_json=extracted))
    message_count = db.query(StoryMessage).filter(StoryMessage.session_id == session.id).count() + 1
    question = next_story_question(session.mode, content, message_count)
    db.add(StoryMessage(session_id=session.id, user_id=current_user.id, role="assistant", content=question, extracted_json={}))
    session.next_question = question
    session.summary = extracted.get("summary") or session.summary
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    messages = db.query(StoryMessage).filter(StoryMessage.session_id == session.id).order_by(StoryMessage.created_at.asc()).all()
    log_usage(db, current_user.id, "message", "story_session", session.id)
    return {
        "session_id": session.id,
        "next_question": question,
        "extracted": extracted,
        "messages": [{"role": message.role, "content": message.content, "created_at": message.created_at.isoformat()} for message in messages],
    }


@router.post("/story-sessions/{session_id}/save-memory")
async def save_story_session_memory(session_id: str, payload: dict | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(StorySession).filter(StorySession.id == session_id, StorySession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Story session not found")
    messages = db.query(StoryMessage).filter(StoryMessage.session_id == session.id, StoryMessage.role == "user").order_by(StoryMessage.created_at.asc()).all()
    if not messages:
        raise HTTPException(status_code=400, detail="No story answers to save yet")
    text = "\n\n".join(message.content for message in messages)
    title = str((payload or {}).get("title", session.title)).strip()[:240] or session.title
    structured = ai_provider.enrich_text(text).model_dump()
    record = memory_service.create_text_memory(db, current_user.id, title, text, structured)
    session.status = "saved"
    session.summary = structured.get("summary") or session.summary
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "save_memory", "story_session", session.id, {"memory_id": record.memory_id})
    return {"memory": record.model_dump(mode="json"), "session_id": session.id, "status": session.status}


@router.get("/people")
async def list_people(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"people": build_people_index(db, current_user.id)}


@router.get("/people/{person_id}")
async def get_person(person_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = unquote(person_id)
    people = build_people_index(db, current_user.id)
    person = next((item for item in people if item["id"] == person_id or item["name"].lower() == name.lower()), None)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    memories = memories_for_person(db, current_user.id, person["name"], limit=16)
    relationships = (
        db.query(FamilyRelationship)
        .filter(FamilyRelationship.user_id == current_user.id)
        .filter((FamilyRelationship.person_a == person["name"]) | (FamilyRelationship.person_b == person["name"]))
        .all()
    )
    return {
        **person,
        "memory_dna": build_memory_dna(db, current_user.id, person["name"]),
        "memories": [memory_card(memory) for memory in memories],
        "relationships": [
            {"relationship_id": row.id, "person_a": row.person_a, "relation": row.relation, "person_b": row.person_b, "notes": row.notes}
            for row in relationships
        ],
    }


@router.get("/people/{person_id}/dna")
async def person_memory_dna(person_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_memory_dna(db, current_user.id, unquote(person_id))


@router.patch("/people/{person_id}/profile")
async def update_person_profile(person_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = unquote(person_id).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Person name is required")
    profile = db.query(PersonProfile).filter(PersonProfile.user_id == current_user.id, PersonProfile.name == name).first()
    if not profile:
        profile = PersonProfile(user_id=current_user.id, name=name)
        db.add(profile)
    if "role" in payload:
        profile.role = str(payload.get("role") or "").strip()[:120] or None
    if "biography" in payload:
        profile.biography = str(payload.get("biography") or "").strip() or None
    metadata = dict(profile.metadata_json or {})
    for key in ["photo_url", "birth_year", "notes", "node_x", "node_y"]:
        if key in payload:
            metadata[key] = payload.get(key)
    profile.metadata_json = metadata
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    log_usage(db, current_user.id, "update", "person_profile", profile.name)
    return {
        "id": quote(profile.name, safe=""),
        "name": profile.name,
        "role": profile.role or infer_role(profile.name),
        "biography": profile.biography or f"{profile.name} appears in this archive.",
        "metadata": profile.metadata_json,
    }


@router.post("/people/{person_id}/ask")
async def ask_person(person_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person = (await get_person(person_id, current_user, db))
    question = str(payload.get("question", f"What should I know about {person['name']}?")).strip()
    memories = memories_for_person(db, current_user.id, person["name"], limit=8)
    summaries = [f"{memory.title}: {memory.summary or memory.raw_text[:200]}" for memory in memories]
    answer = ai_provider.synthesize_answer(question, summaries, [f"{person['name']} appears in {len(memories)} source memories."])
    proofs = proofs_for_memory_ids(db, current_user.id, [memory.id for memory in memories])
    log_usage(db, current_user.id, "ask", "person", person["name"])
    return {"answer": answer, "sources": [memory_card(memory) for memory in memories], "proofs": proofs}


@router.get("/people/{person_id}/portrait")
async def person_portrait(person_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person = await get_person(person_id, current_user, db)
    memories = memories_for_person(db, current_user.id, person["name"], limit=12)
    summaries = [f"{memory.title}: {memory.summary or memory.raw_text[:240]}" for memory in memories]
    dna = build_memory_dna(db, current_user.id, person["name"])
    portrait = ai_provider.person_portrait(person["name"], summaries, dna)
    portrait["proofs"] = proofs_for_memory_ids(db, current_user.id, [memory.id for memory in memories])
    portrait["memory_dna"] = dna
    log_usage(db, current_user.id, "portrait", "person", person["name"])
    return portrait


@router.get("/archive/intelligence")
async def archive_intelligence(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analyze_archive(db, current_user.id)


@router.post("/archive/intelligence/actions")
async def archive_intelligence_action(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    insight_key = str(payload.get("insight_key", "")).strip()
    action = str(payload.get("action", "dismiss")).strip().lower()
    merge_target = str(payload.get("merge_target", "")).strip()[:200] or None
    if not insight_key or action not in {"dismiss", "merge"}:
        raise HTTPException(status_code=400, detail="insight_key and action (dismiss|merge) are required")

    existing = (
        db.query(ArchiveInsightAction)
        .filter(ArchiveInsightAction.user_id == current_user.id, ArchiveInsightAction.insight_key == insight_key)
        .first()
    )
    if existing:
        existing.action = action
        existing.merge_target = merge_target
    else:
        db.add(
            ArchiveInsightAction(
                user_id=current_user.id,
                insight_key=insight_key,
                action=action,
                merge_target=merge_target,
            )
        )
    db.commit()
    log_usage(db, current_user.id, "archive_action", "insight", insight_key, {"action": action})
    return {"success": True, "intelligence": analyze_archive(db, current_user.id)}


@router.post("/proof/export")
async def export_memory_proof(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export a proof-backed answer as HTML or PDF."""
    answer = str(payload.get("answer", "")).strip()
    query = str(payload.get("query", "")).strip() or "MemoryGraph answer"
    proofs = payload.get("proofs") or []
    export_format = str(payload.get("format", "html")).strip().lower()
    if not answer:
        raise HTTPException(status_code=400, detail="answer is required")

    user_name = current_user.full_name or current_user.email
    if export_format == "pdf":
        try:
            pdf_bytes = export_service.export_proof_pdf(answer, query, proofs, user_name=user_name)
            log_usage(db, current_user.id, "export", "proof", "pdf")
            return StreamingResponse(
                io.BytesIO(pdf_bytes.getvalue()),
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=memory_proof_report.pdf"},
            )
        except ImportError:
            raise HTTPException(status_code=501, detail="PDF export requires reportlab")

    html = export_service.export_proof_html(answer, query, proofs, user_name=user_name)
    log_usage(db, current_user.id, "export", "proof", "html")
    return StreamingResponse(
        io.StringIO(html),
        media_type="text/html",
        headers={"Content-Disposition": "attachment; filename=memory_proof_report.html"},
    )


@router.get("/presence/{person_id}")
async def get_presence(person_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person = await get_person(person_id, current_user, db)
    dna = build_memory_dna(db, current_user.id, person["name"])
    return {
        "person": person["name"],
        "profile": person,
        "memory_dna": dna,
        "modes": ["Storytelling", "Advice", "Q&A", "Reminiscing"],
        "disclaimer": "Presence answers are reconstructed from saved memories and sources. They are not a real person or a replacement for family conversation.",
    }


@router.post("/presence/{person_id}/ask")
async def ask_presence(person_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mode = str(payload.get("mode", "Storytelling")).strip() or "Storytelling"
    question = str(payload.get("question", "What should family remember?")).strip()
    person = await get_person(person_id, current_user, db)
    memories = memories_for_person(db, current_user.id, person["name"], limit=10)
    summaries = [f"{memory.title}: {memory.summary or memory.raw_text[:240]}" for memory in memories]
    prompt = f"{mode} mode for {person['name']}: {question}. Answer warmly, but only from the supplied memory sources."
    answer = ai_provider.synthesize_answer(prompt, summaries, [f"{person['name']} has {len(memories)} source memories."])
    log_usage(db, current_user.id, "ask", "presence", person["name"], {"mode": mode})
    return {
        "answer": answer,
        "mode": mode,
        "person": person["name"],
        "sources": [memory_card(memory) for memory in memories],
        "memory_dna": build_memory_dna(db, current_user.id, person["name"]),
    }


@router.get("/memory-proof")
async def list_memory_proof(limit: int = 12, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        active_memories_query(db, current_user.id)
        .filter(Memory.archived_at.is_(None))
        .order_by(Memory.updated_at.desc())
        .limit(max(1, min(limit, 50)))
        .all()
    )
    return {"proofs": [memory_proof_payload(memory) for memory in rows]}


@router.get("/memory-proof/{memory_id}")
async def memory_proof(memory_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memory = active_memories_query(db, current_user.id).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    rels = db.query(Relationship).filter(Relationship.user_id == current_user.id).filter((Relationship.source_id == memory_id) | (Relationship.target_id == memory_id)).all()
    proof = memory_proof_payload(memory)
    proof["relationships"] = [{"source": row.source_id, "relation": row.relation, "target": row.target_id} for row in rels]
    return proof


@router.post("/life-chapters")
async def build_life_chapters(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person = str(payload.get("person", "")).strip()
    if not person:
        people = build_people_index(db, current_user.id)
        person = people[0]["name"] if people else "Family"
    memories = memories_for_person(db, current_user.id, person, limit=30)
    buckets = {
        "Childhood": ["child", "school", "home", "young"],
        "Education": ["college", "study", "class", "professor", "education"],
        "Career": ["work", "career", "business", "job", "office"],
        "Family": ["family", "father", "mother", "wedding", "children"],
        "Turning Points": ["moved", "loss", "first", "changed", "decision"],
        "Legacy": ["remember", "lesson", "grateful", "proud", "legacy"],
    }
    chapters = []
    for title, keywords in buckets.items():
        matches = [memory for memory in memories if any(keyword in f"{memory.title} {memory.summary} {memory.raw_text}".lower() for keyword in keywords)]
        if not matches and memories:
            matches = memories[:2]
        if matches:
            chapters.append(
                {
                    "title": title,
                    "narrative": f"{title} for {person} is reconstructed from {len(matches)} source memories, showing the people, places, and moments that shaped this chapter.",
                    "sources": [memory.title for memory in matches[:5]],
                    "proof": [memory_proof_payload(memory) for memory in matches[:3]],
                }
            )
    return {"person": person, "chapters": chapters}


@router.get("/biography/export.html")
async def biography_export(person: str = "", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = person or (build_people_index(db, current_user.id)[0]["name"] if build_people_index(db, current_user.id) else "Family Archive")
    chapters_payload = await build_life_chapters({"person": target}, current_user, db)
    html = build_biography_html(current_user, f"{target}: A MemoryGraph Biography", chapters_payload["chapters"], build_people_index(db, current_user.id))
    log_usage(db, current_user.id, "export", "biography", target)
    return StreamingResponse(io.StringIO(html), media_type="text/html", headers={"Content-Disposition": f"attachment; filename={target.lower().replace(' ', '_')}_biography.html"})


@router.get("/life-map/current")
async def current_life_map(person: str = "", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_life_map_payload(db, current_user.id, person.strip() or None)


@router.post("/life-map/snapshots")
async def create_life_map_snapshot(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person = str(payload.get("person", "")).strip() or None
    life_map = build_life_map_payload(db, current_user.id, person)
    snapshot = LifeMapSnapshot(
        user_id=current_user.id,
        title=str(payload.get("title", life_map["title"])).strip()[:240] or life_map["title"],
        person=person,
        categories_json=life_map["categories"],
        source_memory_ids_json=life_map["source_memory_ids"],
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    log_usage(db, current_user.id, "create", "life_map_snapshot", snapshot.id)
    return {"snapshot_id": snapshot.id, "title": snapshot.title, "person": snapshot.person, "categories": snapshot.categories_json, "created_at": snapshot.created_at.isoformat()}


@router.get("/life-map/snapshots")
async def list_life_map_snapshots(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    snapshots = db.query(LifeMapSnapshot).filter(LifeMapSnapshot.user_id == current_user.id).order_by(LifeMapSnapshot.created_at.desc()).limit(12).all()
    return {"snapshots": [{"snapshot_id": row.id, "title": row.title, "person": row.person, "categories": row.categories_json, "created_at": row.created_at.isoformat()} for row in snapshots]}


@router.post("/family-rituals")
async def create_family_ritual(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = str(payload.get("title", "Sunday Memory Night")).strip()[:240] or "Sunday Memory Night"
    cadence = str(payload.get("cadence", "weekly")).strip()[:80] or "weekly"
    memories = memory_service.list_memories(db, current_user.id, limit=8)
    questions = []
    for memory in memories[:5]:
        people = memory.structured_data.people
        places = memory.structured_data.places
        subject = people[0] if people else places[0] if places else memory.metadata.original_filename
        questions.append(f"Ask about {subject}: what detail from '{memory.metadata.original_filename}' should the family remember?")
    if not questions:
        questions = ["What story should our family preserve this week?", "Which place shaped our family most?", "Who should we ask for one more memory?"]
    ritual = FamilyRitual(user_id=current_user.id, title=title, cadence=cadence, questions_json=questions, source_memory_ids_json=[memory.memory_id for memory in memories[:5]])
    db.add(ritual)
    db.commit()
    db.refresh(ritual)
    log_usage(db, current_user.id, "create", "family_ritual", ritual.id)
    return {"ritual_id": ritual.id, "title": ritual.title, "cadence": ritual.cadence, "questions": ritual.questions_json, "created_at": ritual.created_at.isoformat()}


@router.get("/family-rituals")
async def list_family_rituals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rituals = db.query(FamilyRitual).filter(FamilyRitual.user_id == current_user.id).order_by(FamilyRitual.created_at.desc()).limit(12).all()
    return {
        "rituals": [
            {
                "ritual_id": ritual.id,
                "title": ritual.title,
                "cadence": ritual.cadence,
                "questions": ritual.questions_json,
                "responses": ritual.responses_json or [],
                "created_at": ritual.created_at.isoformat(),
            }
            for ritual in rituals
        ]
    }


@router.post("/family-rituals/{ritual_id}/respond")
async def respond_family_ritual(ritual_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ritual = db.query(FamilyRitual).filter(FamilyRitual.id == ritual_id, FamilyRitual.user_id == current_user.id).first()
    if not ritual:
        raise HTTPException(status_code=404, detail="Ritual not found")
    question = str(payload.get("question", "")).strip()
    answer = str(payload.get("answer", "")).strip()
    if not answer:
        raise HTTPException(status_code=400, detail="Answer is required")
    memory_id = f"ritual-{uuid.uuid4().hex[:12]}"
    title = f"Ritual: {ritual.title}" + (f" — {question[:60]}" if question else "")
    text = f"Family ritual response for “{ritual.title}”.\n\nQuestion: {question or ritual.questions_json[0] if ritual.questions_json else 'Family memory'}\n\nAnswer: {answer}"
    record = memory_service.create_text_memory(db, current_user.id, title, text, source="ritual", memory_id=memory_id)
    entry = {
        "question": question or (ritual.questions_json[0] if ritual.questions_json else ""),
        "answer": answer,
        "memory_id": record.memory_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    responses = list(ritual.responses_json or [])
    responses.insert(0, entry)
    ritual.responses_json = responses[:20]
    db.commit()
    memory_row = db.get(Memory, record.memory_id)
    log_usage(db, current_user.id, "ritual_response", "family_ritual", ritual.id)
    return {
        "success": True,
        "memory_id": record.memory_id,
        "proof": memory_proof_payload(memory_row) if memory_row else {},
        "responses": ritual.responses_json,
    }


@router.post("/family-rituals/{ritual_id}/email")
async def email_family_ritual(ritual_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ritual = db.query(FamilyRitual).filter(FamilyRitual.id == ritual_id, FamilyRitual.user_id == current_user.id).first()
    if not ritual:
        raise HTTPException(status_code=404, detail="Ritual not found")
    to_email = str(payload.get("email", current_user.email)).strip().lower()
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    sent = EmailService.send_ritual_questions_email(to_email, ritual.title, ritual.questions_json, frontend)
    return {"sent": sent, "email": to_email}


@router.post("/memory-capsules")
async def create_memory_capsule(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = str(payload.get("title", "A memory for later")).strip()[:240] or "A memory for later"
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=400, detail="Capsule message is required")
    unlock_at = None
    if payload.get("unlock_at"):
        try:
            unlock_at = datetime.fromisoformat(str(payload["unlock_at"]).replace("Z", "+00:00"))
        except Exception:
            unlock_at = None
    capsule = MemoryCapsule(
        user_id=current_user.id,
        title=title,
        message=message,
        unlock_type=str(payload.get("unlock_type", "future_date")).strip()[:80],
        unlock_at=unlock_at,
        recipient_name=str(payload.get("recipient_name", "")).strip()[:200] or None,
        recipient_email=str(payload.get("recipient_email", "")).strip()[:320] or None,
    )
    db.add(capsule)
    db.commit()
    db.refresh(capsule)
    log_usage(db, current_user.id, "create", "memory_capsule", capsule.id)
    return {"capsule_id": capsule.id, "title": capsule.title, "share_link": f"/capsules/{capsule.share_token}", "unlock_at": capsule.unlock_at.isoformat() if capsule.unlock_at else None}


@router.get("/memory-capsules")
async def list_memory_capsules(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    capsules = db.query(MemoryCapsule).filter(MemoryCapsule.user_id == current_user.id).order_by(MemoryCapsule.created_at.desc()).limit(12).all()
    return {"capsules": [{"capsule_id": capsule.id, "title": capsule.title, "recipient_name": capsule.recipient_name, "share_token": capsule.share_token, "unlock_at": capsule.unlock_at.isoformat() if capsule.unlock_at else None, "created_at": capsule.created_at.isoformat()} for capsule in capsules]}


@router.get("/public/capsules/{token}")
async def public_memory_capsule(token: str, db: Session = Depends(get_db)):
    capsule = db.query(MemoryCapsule).filter(MemoryCapsule.share_token == token).first()
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found")
    locked = False
    if capsule.unlock_at:
        unlock_at = capsule.unlock_at if capsule.unlock_at.tzinfo else capsule.unlock_at.replace(tzinfo=timezone.utc)
        locked = unlock_at > datetime.now(timezone.utc)
    if not locked and capsule.recipient_email and not capsule.unlock_notified:
        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
        share_link = f"{frontend}/capsules/{capsule.share_token}"
        if EmailService.send_capsule_unlocked_email(capsule.recipient_email, capsule.recipient_name or "friend", capsule.title, share_link):
            capsule.unlock_notified = True
            db.commit()
    return {"title": capsule.title, "recipient_name": capsule.recipient_name, "unlock_at": capsule.unlock_at.isoformat() if capsule.unlock_at else None, "locked": locked, "message": None if locked else capsule.message}


async def build_one_life_story_payload(db: Session, user_id: str, user: User) -> dict:
    people = build_people_index(db, user_id)
    person = people[0]["name"] if people else "Family Archive"
    chapters_payload = await build_life_chapters({"person": person}, user, db)
    proof_rows = (
        active_memories_query(db, user_id)
        .filter(Memory.archived_at.is_(None))
        .order_by(Memory.updated_at.desc())
        .limit(6)
        .all()
    )
    latest_report = db.query(WeeklyReport).filter(WeeklyReport.user_id == user_id).order_by(WeeklyReport.created_at.desc()).first()
    latest_storybook = db.query(Storybook).filter(Storybook.user_id == user_id).order_by(Storybook.created_at.desc()).first()
    return {
        "title": f"{person}: one life, reconstructed",
        "person": person,
        "owner_name": user.full_name or user.email,
        "memory_dna": build_memory_dna(db, user_id, person),
        "chapters": chapters_payload["chapters"],
        "proof": [memory_proof_payload(memory) for memory in proof_rows],
        "weekly_report": {
            "report_id": latest_report.id,
            "subject": latest_report.subject,
            "body": latest_report.body[:900],
        } if latest_report else None,
        "storybook": {
            "storybook_id": latest_storybook.id,
            "title": latest_storybook.title,
            "chapters": latest_storybook.chapters_json[:4],
        } if latest_storybook else None,
        "next_actions": [
            "Ask the archive about the strongest relationship thread.",
            "Open Memory Proof to show where each insight came from.",
            "Create a capsule for a future family member.",
            "Export the biography as a family-ready HTML document.",
        ],
    }


@router.post("/legacy-contacts")
async def create_legacy_contact(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and email are required")
    contact = LegacyContact(user_id=current_user.id, name=name[:200], email=email[:320], relationship=str(payload.get("relationship", "")).strip()[:120] or None, permissions_json=payload.get("permissions") or ["export_archive", "receive_capsules"])
    db.add(contact)
    db.commit()
    db.refresh(contact)
    log_usage(db, current_user.id, "create", "legacy_contact", contact.id)
    return {"contact_id": contact.id, "name": contact.name, "email": contact.email, "relationship": contact.relationship, "permissions": contact.permissions_json}


@router.get("/legacy-contacts")
async def list_legacy_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = db.query(LegacyContact).filter(LegacyContact.user_id == current_user.id).order_by(LegacyContact.created_at.desc()).all()
    return {"contacts": [{"contact_id": contact.id, "name": contact.name, "email": contact.email, "relationship": contact.relationship, "permissions": contact.permissions_json, "created_at": contact.created_at.isoformat()} for contact in contacts]}


@router.get("/trust/local-ai")
async def local_ai_trust(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    status = ai_provider.status()
    memories = active_memories_query(db, current_user.id).filter(Memory.archived_at.is_(None)).count()
    contacts = db.query(LegacyContact).filter(LegacyContact.user_id == current_user.id).count()
    reports = db.query(WeeklyReport).filter(WeeklyReport.user_id == current_user.id).count()
    return {
        "mode": "Private local-first memory OS",
        "ai": status,
        "privacy_promises": [
            "Your archive can be exported at any time.",
            "Answers are grounded in source memories instead of generic biographies.",
            "Local Ollama support keeps the demo zero-cost and private-first.",
            "Legacy contacts and public links are explicit user actions.",
        ],
        "readiness": {
            "memories": memories,
            "legacy_contacts": contacts,
            "weekly_reports": reports,
            "exports_available": True,
        },
    }


@router.get("/demo/one-life-story")
async def one_life_story(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await build_one_life_story_payload(db, current_user.id, current_user)


@router.post("/one-life-story/share")
async def share_one_life_story(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload = await build_one_life_story_payload(db, current_user.id, current_user)
    title = str(payload.get("title", "One life, reconstructed"))[:240]
    share = OneLifeStoryShare(user_id=current_user.id, title=title, payload_json=payload)
    db.add(share)
    db.commit()
    db.refresh(share)
    log_usage(db, current_user.id, "share", "one_life_story", share.id)
    return {"share_token": share.share_token, "share_link": f"/public/one-life-story/{share.share_token}"}


@router.get("/public/one-life-story/{token}")
async def public_one_life_story(token: str, db: Session = Depends(get_db)):
    share = db.query(OneLifeStoryShare).filter(OneLifeStoryShare.share_token == token).first()
    if not share:
        raise HTTPException(status_code=404, detail="Story not found")
    payload = dict(share.payload_json or {})
    payload["shared_at"] = share.created_at.isoformat()
    payload["read_only"] = True
    return payload


@router.get("/family-relationships")
async def list_family_relationships(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(FamilyRelationship).filter(FamilyRelationship.user_id == current_user.id).order_by(FamilyRelationship.created_at.desc()).all()
    return {"relationships": [{"relationship_id": row.id, "person_a": row.person_a, "relation": row.relation, "person_b": row.person_b, "notes": row.notes, "source": row.source} for row in rows]}


@router.post("/family-tree/share")
async def share_family_tree(payload: dict | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = str((payload or {}).get("title", "MemoryGraph Family Tree")).strip()[:240] or "MemoryGraph Family Tree"
    share = FamilyTreeShare(user_id=current_user.id, title=title, tree_json=build_family_tree_payload(db, current_user.id))
    db.add(share)
    db.commit()
    db.refresh(share)
    log_usage(db, current_user.id, "share", "family_tree", share.id)
    return {"share_token": share.share_token, "share_link": f"/public/family-tree/{share.share_token}"}


@router.get("/public/family-tree/{token}")
async def public_family_tree(token: str, db: Session = Depends(get_db)):
    share = db.query(FamilyTreeShare).filter(FamilyTreeShare.share_token == token).first()
    if not share:
        raise HTTPException(status_code=404, detail="Family tree not found")
    return {"title": share.title, "tree": share.tree_json, "created_at": share.created_at.isoformat()}


@router.post("/family-relationships")
async def create_family_relationship(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person_a = str(payload.get("person_a", "")).strip()
    person_b = str(payload.get("person_b", "")).strip()
    relation = str(payload.get("relation", "")).strip()
    if not person_a or not person_b or not relation:
        raise HTTPException(status_code=400, detail="person_a, relation, and person_b are required")
    row = FamilyRelationship(user_id=current_user.id, person_a=person_a[:240], person_b=person_b[:240], relation=relation[:80], notes=str(payload.get("notes", "")).strip() or None)
    db.add(row)
    db.commit()
    db.refresh(row)
    log_usage(db, current_user.id, "create", "family_relationship", row.id)
    return {"relationship_id": row.id, "person_a": row.person_a, "relation": row.relation, "person_b": row.person_b, "notes": row.notes}


@router.patch("/family-relationships/{relationship_id}")
async def update_family_relationship(relationship_id: str, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(FamilyRelationship).filter(FamilyRelationship.id == relationship_id, FamilyRelationship.user_id == current_user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Relationship not found")
    for field in ["person_a", "relation", "person_b", "notes"]:
        if field in payload:
            setattr(row, field, str(payload.get(field) or "").strip())
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "update", "family_relationship", row.id)
    return {"relationship_id": row.id, "person_a": row.person_a, "relation": row.relation, "person_b": row.person_b, "notes": row.notes}


@router.delete("/family-relationships/{relationship_id}")
async def delete_family_relationship(relationship_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(FamilyRelationship).filter(FamilyRelationship.id == relationship_id, FamilyRelationship.user_id == current_user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Relationship not found")
    db.delete(row)
    db.commit()
    log_usage(db, current_user.id, "delete", "family_relationship", relationship_id)
    return {"success": True}


@router.get("/legacy/score")
async def legacy_score(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return compute_legacy_payload(db, current_user.id)


@router.get("/care/signals")
async def care_signals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = active_memories_query(db, current_user.id).filter(Memory.archived_at.is_(None)).limit(60).all()
    text = " ".join(f"{row.title} {row.summary} {row.raw_text}" for row in rows).lower()
    warmth = sum(text.count(word) for word in ["love", "grateful", "proud", "family", "thank", "together"])
    isolation = sum(text.count(word) for word in ["alone", "lonely", "miss", "distance", "isolated"])
    people = len(build_people_index(db, current_user.id))
    signals = [
        {"label": "Connection rhythm", "value": "Healthy variety" if people >= 4 else "More family voices could help", "tone": "good" if people >= 4 else "watch"},
        {"label": "Emotional warmth", "value": "Warm moments detected" if warmth else "Still learning emotional tone", "tone": "good" if warmth else "neutral"},
        {"label": "Isolation language", "value": "Gentle check-in suggested" if isolation else "No strong isolation language found", "tone": "watch" if isolation else "good"},
        {"label": "Family contact opportunity", "value": "Send a weekly letter or heart message", "tone": "neutral"},
    ]
    return {"signals": signals, "disclaimer": "Care Signals are supportive family check-in cues, not medical advice, diagnosis, or crisis detection."}


@router.post("/storybooks")
async def create_storybook(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    style = str(payload.get("style", "Heritage Gallery")).strip() or "Heritage Gallery"
    query_text = str(payload.get("query", "")).strip()
    memories = memory_service.search_memories(db, current_user.id, query_text, limit=6) if query_text else memory_service.list_memories(db, current_user.id, limit=6)
    chapters = []
    for index, memory in enumerate(memories[:6], start=1):
        chapters.append(
            {
                "chapter": index,
                "title": memory.metadata.original_filename,
                "summary": memory.structured_data.summary or memory.raw_text[:180],
                "visual_prompt": f"{style} illustration of {memory.structured_data.summary or memory.metadata.original_filename}",
                "people": memory.structured_data.people,
                "places": memory.structured_data.places,
                "memory_id": memory.memory_id,
            }
        )
    title = str(payload.get("title", "A Whole Life, Beautifully Told")).strip()[:240] or "A Whole Life, Beautifully Told"
    storybook = Storybook(user_id=current_user.id, title=title, style=style, source_query=query_text, chapters_json=chapters, source_memory_ids_json=[chapter["memory_id"] for chapter in chapters])
    db.add(storybook)
    db.commit()
    db.refresh(storybook)
    log_usage(db, current_user.id, "create", "storybook", storybook.id)
    return {"storybook_id": storybook.id, "title": storybook.title, "style": storybook.style, "chapters": storybook.chapters_json, "created_at": storybook.created_at.isoformat()}


@router.get("/storybooks")
async def list_storybooks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    books = db.query(Storybook).filter(Storybook.user_id == current_user.id).order_by(Storybook.created_at.desc()).limit(12).all()
    return {"storybooks": [{"storybook_id": book.id, "title": book.title, "style": book.style, "chapters": book.chapters_json, "created_at": book.created_at.isoformat()} for book in books]}


@router.get("/storybooks/{storybook_id}")
async def get_storybook(storybook_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.query(Storybook).filter(Storybook.id == storybook_id, Storybook.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Storybook not found")
    return {"storybook_id": book.id, "title": book.title, "style": book.style, "chapters": book.chapters_json, "source_memory_ids": book.source_memory_ids_json, "created_at": book.created_at.isoformat()}


@router.post("/storybooks/{storybook_id}/share")
async def share_storybook(storybook_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.query(Storybook).filter(Storybook.id == storybook_id, Storybook.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Storybook not found")
    book.share_token = book.share_token or secrets.token_urlsafe(24)
    book.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "share", "storybook", book.id)
    return {"share_token": book.share_token, "share_link": f"/public/storybooks/{book.share_token}"}


@router.get("/public/storybooks/{token}")
async def public_storybook(token: str, db: Session = Depends(get_db)):
    book = db.query(Storybook).filter(Storybook.share_token == token).first()
    if not book:
        raise HTTPException(status_code=404, detail="Storybook not found")
    return {"title": book.title, "style": book.style, "chapters": book.chapters_json, "created_at": book.created_at.isoformat()}


def storybook_html(book: Storybook) -> str:
    scenes = "".join(
        f"<section><p class='eyebrow'>Scene {chapter.get('chapter')}</p><h2>{chapter.get('title')}</h2><p>{chapter.get('summary')}</p><p class='meta'>{', '.join(chapter.get('people') or [])} {' · '.join(chapter.get('places') or [])}</p></section>"
        for chapter in book.chapters_json
    )
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{book.title}</title>
<style>body{{margin:0;background:#29231f;color:#f8fafc;font-family:Georgia,serif}}main{{max-width:980px;margin:auto;padding:56px 24px}}h1{{font-size:56px;text-align:center}}section{{background:#fff7ed;color:#111827;border:8px solid #b7791f;margin:24px 0;padding:32px;box-shadow:0 18px 45px rgba(0,0,0,.28)}}h2{{font-size:34px}}.eyebrow,.meta{{font:700 12px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#b7791f}}</style></head>
<body><main><p class="eyebrow">MemoryGraph Storybook</p><h1>{book.title}</h1>{scenes}</main></body></html>"""


@router.get("/storybooks/{storybook_id}/export.html")
async def export_storybook_html(storybook_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.query(Storybook).filter(Storybook.id == storybook_id, Storybook.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Storybook not found")
    log_usage(db, current_user.id, "export", "storybook", book.id)
    return StreamingResponse(io.StringIO(storybook_html(book)), media_type="text/html", headers={"Content-Disposition": f"attachment; filename={book.title.lower().replace(' ', '_')}_storybook.html"})


@router.post("/invites")
async def create_invite(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expires_days = int(payload.get("expires_days", 30) or 30)
    invite = InviteLink(
        user_id=current_user.id,
        recipient_email=str(payload.get("recipient_email", "")).strip().lower()[:320] or None,
        recipient_name=str(payload.get("recipient_name", "")).strip()[:200] or None,
        relationship=str(payload.get("relationship", "")).strip()[:120] or None,
        expires_at=datetime.now(timezone.utc) + timedelta(days=max(1, min(expires_days, 365))),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    log_usage(db, current_user.id, "create_invite", "family", invite.id)
    return {
        "success": True,
        "invite_id": invite.id,
        "invite_token": invite.invite_token,
        "invite_link": f"/invite/{invite.invite_token}",
        "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
    }


@router.get("/invites")
async def list_invites(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invites = db.query(InviteLink).filter(InviteLink.user_id == current_user.id).order_by(InviteLink.created_at.desc()).all()
    return {
        "invites": [
            {
                "invite_id": invite.id,
                "recipient_email": invite.recipient_email,
                "recipient_name": invite.recipient_name,
                "relationship": invite.relationship,
                "status": invite.status,
                "invite_link": f"/invite/{invite.invite_token}",
                "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
                "created_at": invite.created_at.isoformat() if invite.created_at else None,
            }
            for invite in invites
        ]
    }


@router.get("/invites/public/{invite_token}")
async def get_public_invite(invite_token: str, db: Session = Depends(get_db)):
    invite = db.query(InviteLink).filter(InviteLink.invite_token == invite_token).first()
    if not invite or invite.status != "active":
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.expires_at and auth_service.as_utc(invite.expires_at) and datetime.now(timezone.utc) > auth_service.as_utc(invite.expires_at):
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Invite expired")
    owner = db.get(User, invite.user_id)
    return {
        "invite_token": invite.invite_token,
        "owner_name": owner.full_name if owner else "Family archivist",
        "recipient_name": invite.recipient_name,
        "relationship": invite.relationship,
        "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
    }


@router.post("/invites/{invite_token}/accept")
async def accept_invite(invite_token: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invite = db.query(InviteLink).filter(InviteLink.invite_token == invite_token).first()
    if not invite or invite.status != "active":
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot accept your own invite")
    expires_at = auth_service.as_utc(invite.expires_at)
    if expires_at and datetime.now(timezone.utc) > expires_at:
            invite.status = "expired"
            db.commit()
            raise HTTPException(status_code=410, detail="Invite expired")

    existing = (
        db.query(FamilyArchiveAccess)
        .filter(
            FamilyArchiveAccess.owner_user_id == invite.user_id,
            FamilyArchiveAccess.member_user_id == current_user.id,
        )
        .first()
    )
    if not existing:
        db.add(
            FamilyArchiveAccess(
                owner_user_id=invite.user_id,
                member_user_id=current_user.id,
                role="contributor",
                invite_id=invite.id,
            )
        )
    invite.status = "accepted"
    invite.used_at = datetime.now(timezone.utc)
    db.commit()
    log_usage(db, current_user.id, "accept_invite", "family", invite.id)
    owner = db.get(User, invite.user_id)
    return {
        "success": True,
        "owner_id": invite.user_id,
        "owner_name": owner.full_name if owner else None,
        "role": "contributor",
    }


@router.get("/family/shared-archives")
async def list_shared_archives(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = (
        db.query(FamilyArchiveAccess)
        .filter(FamilyArchiveAccess.member_user_id == current_user.id)
        .order_by(FamilyArchiveAccess.created_at.desc())
        .all()
    )
    results = []
    for membership in memberships:
        owner = db.get(User, membership.owner_user_id)
        results.append(
            {
                "owner_id": membership.owner_user_id,
                "owner_name": owner.full_name if owner else owner.email if owner else "Unknown",
                "role": membership.role,
                "joined_at": membership.created_at.isoformat() if membership.created_at else None,
            }
        )
    return {"archives": results}


@router.get("/audit")
async def audit_log(limit: int = 40, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = (
        db.query(UsageLog)
        .filter(UsageLog.user_id == current_user.id)
        .order_by(UsageLog.created_at.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )
    return {
        "events": [
            {
                "id": log.id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "metadata": log.metadata_json or log.metadata_ or {},
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
    }


@router.get("/exports/relationships.csv")
@router.get("/export/relationships.csv")
async def export_relationships_csv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Relationship).filter(Relationship.user_id == current_user.id).order_by(Relationship.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Source Type", "Source", "Relationship", "Target Type", "Target"])
    for row in rows:
        writer.writerow([row.source_type, row.source_id, row.relation, row.target_type, row.target_id])
    output.seek(0)
    log_usage(db, current_user.id, "export", "relationships", "csv")
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=memorygraph_relationships.csv"})


@router.get("/exports/family-report.html")
@router.get("/export/family-report.html")
async def export_family_report_html(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = create_weekly_report_payload(db, current_user)
    highlights = "".join(
        f"<li><strong>{item['title']}</strong><br><span>{item['summary']}</span></li>"
        for item in report["summary"]["highlights"]
    )
    html = f"""<!doctype html>
<html>
<head><meta charset="utf-8"><title>MemoryGraph Family Report</title>
<style>
body{{font-family:Georgia,'Times New Roman',serif;background:#f6f1e8;color:#111827;padding:48px;line-height:1.6}}
main{{max-width:820px;margin:auto;background:white;border:1px solid #e7d8bb;border-radius:18px;padding:42px;box-shadow:0 18px 55px rgba(17,24,39,.12)}}
.eyebrow{{font:700 12px Arial,sans-serif;letter-spacing:.22em;color:#b7791f;text-transform:uppercase}}
h1{{font-size:42px;line-height:1.05;margin:12px 0 16px}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}}
.stat{{background:#f8fafc;border-radius:14px;padding:16px;font-family:Arial,sans-serif}}
.stat b{{display:block;font-size:28px}}
li{{margin:14px 0}}
</style></head>
<body><main>
<p class="eyebrow">MemoryGraph Weekly Letter</p>
<h1>Your family archive, beautifully connected.</h1>
<p>{report['body'].replace(chr(10), '<br>')}</p>
<div class="stats">
<div class="stat"><b>{report['summary']['memory_count']}</b>Memories</div>
<div class="stat"><b>{report['summary']['relationship_count']}</b>Connections</div>
<div class="stat"><b>{len(report['summary']['timeline_years'])}</b>Years</div>
</div>
<h2>Highlights</h2>
<ul>{highlights}</ul>
</main></body></html>"""
    log_usage(db, current_user.id, "export", "family_report", "html")
    return StreamingResponse(
        io.StringIO(html),
        media_type="text/html",
        headers={"Content-Disposition": "attachment; filename=memorygraph_family_report.html"},
    )


# ==================== SHARING & COLLABORATION ====================

@router.post("/shares/create", response_model=ShareResponse)
async def create_share(
    payload: CreateShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a shareable link for a memory (public or private)."""
    memory = db.query(Memory).filter(Memory.id == payload.memory_id, Memory.user_id == current_user.id, Memory.deleted_at.is_(None)).first()
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
    
    if share.expires_at:
        expires_at = share.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Share has expired")
    
    if not share.is_public:
        raise HTTPException(status_code=403, detail="This share is private")
    
    memory = db.query(Memory).filter(Memory.id == share.memory_id, Memory.deleted_at.is_(None)).first()
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

@router.get("/exports/archive.json")
@router.get("/export/json")
async def export_json(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export all memories as JSON."""
    rows = active_memories_query(db, current_user.id).all()
    relationships = db.query(Relationship).filter(Relationship.user_id == current_user.id).all()
    timeline = db.query(TimelineEvent).filter(TimelineEvent.user_id == current_user.id).order_by(TimelineEvent.year).all()
    data = {
        "exported_at": datetime.utcnow().isoformat(),
        "owner": {"email": current_user.email, "name": current_user.full_name},
        "memories": [
            {
                "id": r.id,
                "title": r.title,
                "summary": r.summary,
                "raw_text": r.raw_text,
                "structured_data": r.structured_data,
                "metadata": r.metadata_json,
                "archived_at": r.archived_at.isoformat() if r.archived_at else None,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
            }
            for r in rows
        ],
        "relationships": [
            {
                "source_type": row.source_type,
                "source": row.source_id,
                "relation": row.relation,
                "target_type": row.target_type,
                "target": row.target_id,
            }
            for row in relationships
        ],
        "timeline": [
            {
                "memory_id": row.memory_id,
                "label": row.label,
                "year": row.year,
                "date_text": row.date_text,
            }
            for row in timeline
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
    rows = active_memories_query(db, current_user.id).all()
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
    rows = active_memories_query(db, current_user.id).all()
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
        metadata_=metadata or {},
        metadata_json=metadata or {},
    )
    db.add(log)
    try:
        db.commit()
    except Exception:
        db.rollback()
        pass  # Don't fail requests if logging fails


@router.get("/usage/stats", response_model=UsageStatsResponse)
async def get_usage_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's current usage statistics."""
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    memories_count = active_memories_query(db, current_user.id).filter(Memory.archived_at.is_(None)).count()
    
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
