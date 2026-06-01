# Updated by GitHub contribution automation.
"""Single payload for authenticated app bootstrap."""

from sqlalchemy.orm import Session

from sqlalchemy import func

from app.api.routes import active_memories_query, build_people_index, proofs_for_memory_ids
from app.services.archive_intelligence import analyze_archive
from app.models.database import (
    FamilyRelationship,
    FamilyRitual,
    LegacyContact,
    LifeMapSnapshot,
    Memory,
    MemoryCapsule,
    Relationship,
    ReportRecipient,
    Storybook,
    StorySession,
    TimelineEvent,
    WeeklyReport,
)
from app.services.ai_provider import ai_provider
from app.services.archive_access import list_shared_archives
from app.services.usage_limits import usage_snapshot


def _memory_cards(db: Session, user_id: str, limit: int = 48):
    rows = (
        active_memories_query(db, user_id)
        .filter(Memory.archived_at.is_(None))
        .order_by(Memory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "memory_id": r.id,
            "title": r.title or "Untitled",
            "summary": r.summary or "",
            "status": r.status,
            "processing_stage": r.processing_stage,
            "processing_error": r.processing_error,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in rows
    ]


def _insights(db: Session, user_id: str):
    rows = active_memories_query(db, user_id).filter(Memory.archived_at.is_(None)).all()
    summaries = [
        {"memory_id": r.id, "title": r.title or "", "summary": r.summary or ""}
        for r in rows[:24]
    ]
    people_count: dict[str, int] = {}
    for row in rows:
        data = row.structured_data if isinstance(row.structured_data, dict) else {}
        for person in data.get("people", []) or []:
            if person:
                people_count[str(person)] = people_count.get(str(person), 0) + 1
    top_people = sorted(people_count.items(), key=lambda item: item[1], reverse=True)[:12]
    duplicates: list[list[str]] = []
    seen: dict[str, str] = {}
    for row in rows:
        key = (row.title or "").strip().lower()
        if not key:
            continue
        if key in seen and seen[key] != row.id:
            duplicates.append([seen[key], row.id])
        else:
            seen[key] = row.id
    return {"count": len(rows), "summaries": summaries, "duplicates": duplicates[:10], "top_people": top_people}


def _graph(db: Session, user_id: str):
    rows = db.query(Relationship).filter(Relationship.user_id == user_id).limit(250).all()
    nodes: dict[str, dict] = {}
    links = []
    for row in rows:
        for node_id, label in ((row.source_id, row.source_id), (row.target_id, row.target_id)):
            if node_id not in nodes:
                nodes[node_id] = {"id": node_id, "group": row.source_type or "person", "label": label}
        links.append(
            {
                "source": row.source_id,
                "target": row.target_id,
                "label": row.relation or "related",
            }
        )
    return {"nodes": list(nodes.values()), "links": links}


def build_bootstrap(db: Session, user_id: str) -> dict:
    total_memories = active_memories_query(db, user_id).filter(Memory.archived_at.is_(None)).count()
    memories = _memory_cards(db, user_id)
    timeline_rows = (
        db.query(TimelineEvent.year, func.count(TimelineEvent.id))
        .filter(TimelineEvent.user_id == user_id, TimelineEvent.year.isnot(None))
        .group_by(TimelineEvent.year)
        .all()
    )
    timeline = [{"year": int(y), "count": int(c)} for y, c in timeline_rows if y]
    relationships = db.query(FamilyRelationship).filter(FamilyRelationship.user_id == user_id).all()
    processing = (
        active_memories_query(db, user_id)
        .filter(Memory.archived_at.is_(None), Memory.status.in_(["pending", "processing", "failed"]))
        .order_by(Memory.updated_at.desc())
        .limit(50)
        .all()
    )
    notifications = []
    for row in processing:
        if row.status == "failed":
            notifications.append(
                {
                    "id": f"failed-{row.id}",
                    "type": "processing_failed",
                    "title": "Memory needs attention",
                    "body": row.title or row.id,
                    "memory_id": row.id,
                }
            )
        elif row.status in {"pending", "processing"}:
            notifications.append(
                {
                    "id": f"processing-{row.id}",
                    "type": "processing",
                    "title": "Still organizing",
                    "body": f"{row.title or 'Upload'} — {row.processing_stage}",
                    "memory_id": row.id,
                }
            )

    return {
        "memory_count": total_memories,
        "memories": memories,
        "insights": _insights(db, user_id),
        "graph": _graph(db, user_id),
        "timeline": timeline,
        "story_sessions": [
            {
                "session_id": s.id,
                "mode": s.mode,
                "title": s.title,
                "status": s.status,
                "next_question": s.next_question,
                "summary": s.summary,
                "message_count": len(s.messages),
            }
            for s in db.query(StorySession).filter(StorySession.user_id == user_id).order_by(StorySession.created_at.desc()).limit(20)
        ],
        "people": build_people_index(db, user_id),
        "family_relationships": [
            {
                "relationship_id": r.id,
                "person_a": r.person_a,
                "relation": r.relation,
                "person_b": r.person_b,
                "notes": r.notes,
            }
            for r in relationships
        ],
        "weekly_reports": [
            {
                "report_id": r.id,
                "title": r.title,
                "recipient_type": r.recipient_type,
                "subject": r.subject,
                "body": r.body,
                "share_token": r.share_token,
                "is_public": r.is_public,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in db.query(WeeklyReport).filter(WeeklyReport.user_id == user_id).order_by(WeeklyReport.created_at.desc()).limit(12)
        ],
        "report_recipients": [
            {
                "recipient_id": r.id,
                "name": r.name,
                "email": r.email,
                "relationship": r.relationship,
                "cadence": r.cadence,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in db.query(ReportRecipient).filter(ReportRecipient.user_id == user_id).all()
        ],
        "storybooks": [
            {
                "storybook_id": b.id,
                "title": b.title,
                "style": b.style,
                "chapters": b.chapters_json or [],
                "created_at": b.created_at.isoformat() if b.created_at else "",
                "share_token": b.share_token,
            }
            for b in db.query(Storybook).filter(Storybook.user_id == user_id).order_by(Storybook.created_at.desc()).limit(12)
        ],
        "memory_proofs": {
            "proofs": proofs_for_memory_ids(
                db,
                user_id,
                [m["memory_id"] for m in memories[:12]],
            )
        },
        "family_rituals": [
            {
                "ritual_id": r.id,
                "title": r.title,
                "cadence": r.cadence,
                "questions": r.questions_json or [],
                "responses": r.responses_json or [],
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in db.query(FamilyRitual).filter(FamilyRitual.user_id == user_id).limit(20)
        ],
        "memory_capsules": [
            {
                "capsule_id": c.id,
                "title": c.title,
                "recipient_name": c.recipient_name,
                "share_token": c.share_token,
                "unlock_at": c.unlock_at.isoformat() if c.unlock_at else None,
                "created_at": c.created_at.isoformat() if c.created_at else "",
            }
            for c in db.query(MemoryCapsule).filter(MemoryCapsule.user_id == user_id).limit(20)
        ],
        "legacy_contacts": [
            {
                "contact_id": c.id,
                "name": c.name,
                "email": c.email,
                "relationship": c.relationship,
                "permissions": c.permissions_json or [],
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in db.query(LegacyContact).filter(LegacyContact.user_id == user_id).limit(20)
        ],
        "life_map_snapshots": [
            {
                "snapshot_id": s.id,
                "title": s.title,
                "person": s.person,
                "categories": s.categories_json or [],
                "created_at": s.created_at.isoformat() if s.created_at else "",
            }
            for s in db.query(LifeMapSnapshot).filter(LifeMapSnapshot.user_id == user_id).limit(20)
        ],
        "archive_intelligence": analyze_archive(db, user_id),
        "usage": usage_snapshot(db, user_id),
        "ai": ai_provider.status(),
        "notifications": notifications,
        "processing_queue": [
            {
                "memory_id": r.id,
                "title": r.title,
                "status": r.status,
                "processing_stage": r.processing_stage,
                "processing_error": r.processing_error,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in processing
        ],
        "shared_archives": list_shared_archives(db, user_id),
    }
