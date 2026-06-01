# Updated by GitHub contribution automation.
"""Full sample archive: memories plus family artifacts for a rich first-run experience."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.database import (
    FamilyRelationship,
    FamilyRitual,
    LegacyContact,
    LifeMapSnapshot,
    Memory,
    MemoryCapsule,
    PersonProfile,
    ReportRecipient,
    Storybook,
    StoryMessage,
    StorySession,
    WeeklyReport,
)
from app.services.memory import MemoryService

memory_service = MemoryService()


PERSON_PHOTOS = {
    "Grandfather": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
    "Grandmother": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    "Father": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    "Mother": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    "Amit": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    "Neha": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
}


FAMILY_RELATIONSHIPS = [
    ("Grandfather", "father_of", "Father"),
    ("Grandmother", "married_to", "Grandfather"),
    ("Mother", "married_to", "Father"),
    ("Father", "son_of", "Grandfather"),
    ("Neha", "cousin_of", "Father"),
    ("Amit", "friend_of", "Father"),
    ("Rahul", "friend_of", "Father"),
    ("Father", "parent_of", "Me"),
    ("Mother", "parent_of", "Me"),
    ("Grandfather", "raised_in", "Mumbai"),
    ("Father", "studied_in", "Pune"),
    ("Father", "worked_in", "Bangalore"),
]


def seed_sample_extras(db: Session, user_id: str) -> dict:
    """Idempotent-ish seed of profiles, family data, and story artifacts."""
    created: dict[str, int] = {}

    for name, photo in PERSON_PHOTOS.items():
        profile = db.query(PersonProfile).filter(PersonProfile.user_id == user_id, PersonProfile.name == name).first()
        if not profile:
            profile = PersonProfile(user_id=user_id, name=name)
            db.add(profile)
        profile.role = profile.role or ("Patriarch" if name == "Grandfather" else "Family")
        profile.biography = profile.biography or f"{name} appears throughout the Patel family archive across decades."
        profile_meta = {**(profile.metadata_json or {}), "photo_url": photo}
        if name == "Father":
            profile_meta.setdefault("birth_year", 1978)
        profile.metadata_json = profile_meta
        profile.updated_at = datetime.now(timezone.utc)

    for person_a, relation, person_b in FAMILY_RELATIONSHIPS:
        exists = (
            db.query(FamilyRelationship)
            .filter(
                FamilyRelationship.user_id == user_id,
                FamilyRelationship.person_a == person_a,
                FamilyRelationship.relation == relation,
                FamilyRelationship.person_b == person_b,
            )
            .first()
        )
        if not exists:
            db.add(
                FamilyRelationship(
                    user_id=user_id,
                    person_a=person_a,
                    relation=relation,
                    person_b=person_b,
                    notes=f"From sample archive",
                    source="sample",
                )
            )
    created["family_relationships"] = len(FAMILY_RELATIONSHIPS)

    if not db.query(ReportRecipient).filter(ReportRecipient.user_id == user_id).first():
        db.add(
            ReportRecipient(
                user_id=user_id,
                name="Mother",
                email="family@example.com",
                relationship="Parent",
                cadence="weekly",
            )
        )
        created["report_recipients"] = 1

    if not db.query(WeeklyReport).filter(WeeklyReport.user_id == user_id).first():
        db.add(
            WeeklyReport(
                user_id=user_id,
                title="Weekly family digest",
                recipient_type="Family Group",
                subject="This week in the Patel archive",
                body="Grandfather's Marine Drive stories, father's business milestones, and new photos from Delhi.",
                summary_json={"highlights": ["Marine Drive", "Diwali", "Hospital recovery"]},
            )
        )
        created["weekly_reports"] = 1

    if not db.query(StorySession).filter(StorySession.user_id == user_id).first():
        session = StorySession(
            user_id=user_id,
            mode="Legacy",
            title="Grandfather's Mumbai years",
            status="active",
            next_question="What did grandfather say about the port?",
            summary="Collecting stories about grandfather in Mumbai and Dadar.",
        )
        db.add(session)
        db.flush()
        db.add(
            StoryMessage(
                session_id=session.id,
                user_id=user_id,
                role="assistant",
                content="Let's preserve your grandfather's Mumbai stories. What place comes to mind first?",
                extracted_json={},
            )
        )
        db.add(
            StoryMessage(
                session_id=session.id,
                user_id=user_id,
                role="user",
                content="Marine Drive at sunset — he mailed his first salary home from the port office.",
                extracted_json={"places": ["Marine Drive", "Mumbai"], "people": ["Grandfather"]},
            )
        )
        created["story_sessions"] = 1

    memory_ids = [
        row[0]
        for row in db.query(Memory.id).filter(Memory.user_id == user_id, Memory.id.like("demo-%")).limit(8).all()
    ]

    if not db.query(Storybook).filter(Storybook.user_id == user_id).first():
        db.add(
            Storybook(
                user_id=user_id,
                title="Patel Family — Three Generations",
                style="Heritage Gallery",
                source_query="grandfather Mumbai",
                chapters_json=[
                    {
                        "chapter": 1,
                        "title": "Dadar Childhood",
                        "summary": "Grandfather's terrace stories in the 1950s.",
                        "visual_prompt": "Monsoon terrace in Mumbai",
                        "people": ["Grandfather"],
                        "places": ["Dadar", "Mumbai"],
                    },
                    {
                        "chapter": 2,
                        "title": "Father's Pune Years",
                        "summary": "Engineering hostel and Sunday calls home.",
                        "visual_prompt": "College friends studying at night",
                        "people": ["Father", "Rahul"],
                        "places": ["Pune"],
                    },
                    {
                        "chapter": 3,
                        "title": "Marine Drive",
                        "summary": "Three generations walking the waterfront.",
                        "visual_prompt": "Sunset on Marine Drive",
                        "people": ["Grandfather", "Father", "Me"],
                        "places": ["Marine Drive"],
                    },
                ],
                source_memory_ids_json=memory_ids,
                share_token=secrets.token_urlsafe(18),
            )
        )
        created["storybooks"] = 1

    if not db.query(MemoryCapsule).filter(MemoryCapsule.user_id == user_id).first():
        db.add(
            MemoryCapsule(
                user_id=user_id,
                title="Letter for the next generation",
                message="When you read this, ask the archive about grandfather's port days and father's first business.",
                unlock_type="future_date",
                unlock_at=datetime.now(timezone.utc) + timedelta(days=365),
                recipient_name="Future grandchildren",
            )
        )
        created["memory_capsules"] = 1

    if not db.query(FamilyRitual).filter(FamilyRitual.user_id == user_id).first():
        db.add(
            FamilyRitual(
                user_id=user_id,
                title="Sunday Memory Night",
                cadence="weekly",
                questions_json=[
                    "What story should we preserve this week?",
                    "Who should we interview next?",
                    "Which photo needs a caption?",
                ],
                responses_json=[
                    {
                        "question": "What story should we preserve this week?",
                        "answer": "Grandfather's Marine Drive walk in 2019.",
                        "memory_id": memory_ids[0] if memory_ids else "demo-fam_11",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
                ],
                source_memory_ids_json=memory_ids,
            )
        )
        created["family_rituals"] = 1

    if not db.query(LifeMapSnapshot).filter(LifeMapSnapshot.user_id == user_id).first():
        db.add(
            LifeMapSnapshot(
                user_id=user_id,
                title="Patel family map",
                person="Grandfather",
                categories_json=[
                    {"label": "Places", "count": 12, "nodes": [{"title": "Mumbai", "summary": "Port and Marine Drive"}]},
                    {"label": "People", "count": 8, "nodes": [{"title": "Father", "summary": "Son and archivist"}]},
                ],
                source_memory_ids_json=memory_ids,
            )
        )
        created["life_map_snapshots"] = 1

    if db.query(LegacyContact).filter(LegacyContact.user_id == user_id).count() < 2:
        for name, email, rel in [("Mother", "mother@example.com", "Parent"), ("Amit", "amit@example.com", "Family friend")]:
            if not db.query(LegacyContact).filter(LegacyContact.user_id == user_id, LegacyContact.email == email).first():
                db.add(
                    LegacyContact(
                        user_id=user_id,
                        name=name,
                        email=email,
                        relationship=rel,
                        permissions_json=["view", "contribute"],
                    )
                )
        created["legacy_contacts"] = 2

    # One failed memory for processing queue demo
    failed = db.query(Memory).filter(Memory.user_id == user_id, Memory.id == "demo-fam_failed_scan").first()
    if not failed:
        row = Memory(
            id="demo-fam_failed_scan",
            user_id=user_id,
            title="Damaged negative scan — needs retry",
            summary="",
            raw_text="",
            structured_data={},
            metadata_json={"file_type": "image"},
            status="failed",
            processing_stage="extract",
            processing_error="Could not read damaged scan — try re-uploading a clearer photo.",
        )
        db.add(row)
        created["failed_memory"] = 1

    db.commit()
    return created


def seed_full_sample_archive(db: Session, user_id: str, dataset_key: str = "family_archive_flagship") -> dict:
    records = memory_service.seed_demo_memories(db, user_id, dataset_key=dataset_key)
    extras = seed_sample_extras(db, user_id)
    return {"memories_created": len(records), "extras": extras}
