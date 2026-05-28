import re

from sqlalchemy.orm import Session

from app.models.database import Memory, Relationship, TimelineEvent
from app.models.memory import TimeMachineResponse
from app.services.enrichment import EnrichmentService
from app.services.memory import MemoryService


class TimeMachineService:
    def __init__(self, memory_service: MemoryService | None = None):
        self.memory_service = memory_service or MemoryService()
        self.enrichment = EnrichmentService()

    def query(self, db: Session, user_id: str, query: str, birth_year: int | None = None) -> TimeMachineResponse:
        person = self.extract_person(query)
        age_range = self.extract_age_range(query)
        year_range = self.extract_year_range(query)

        needs_birth_year = False
        year_start = None
        year_end = None
        if age_range:
            if birth_year is None:
                needs_birth_year = True
            else:
                year_start = birth_year + age_range[0]
                year_end = birth_year + age_range[1]
        elif year_range:
            year_start, year_end = year_range

        memories = self.find_memories(db, user_id, person, year_start, year_end)
        relationships = self.find_relationships(db, user_id, person)
        timeline = self.build_timeline(db, user_id, memories, year_start, year_end)

        summaries = [
            f"{item.memory_id}: {item.structured_data.summary or item.raw_text[:240]}"
            for item in memories
        ]
        relationship_text = [
            f"{item['source']} {item['relation']} {item['target']}"
            for item in relationships
        ]

        if needs_birth_year:
            narrative = f"I can build this Time Machine view for {person or 'that person'}, but I need their birth year to translate age {age_range[0]}-{age_range[1]} into calendar years."
        elif memories:
            narrative = self.enrichment.synthesize_answer(query, summaries, relationship_text)
        else:
            narrative = "I could not find enough connected memories for that Time Machine view yet."

        return TimeMachineResponse(
            query=query,
            needs_birth_year=needs_birth_year,
            resolved_person=person,
            year_start=year_start,
            year_end=year_end,
            narrative=narrative,
            timeline=timeline,
            memories=memories,
            relationships=relationships,
        )

    def extract_person(self, query: str) -> str | None:
        lowered = query.lower()
        candidates = ["father", "mother", "grandfather", "grandmother", "dad", "mom"]
        for candidate in candidates:
            if candidate in lowered:
                return candidate
        match = re.search(r"\b(?:for|about)\s+my\s+([a-zA-Z]+)", query, re.IGNORECASE)
        return match.group(1).lower() if match else None

    def extract_age_range(self, query: str) -> tuple[int, int] | None:
        match = re.search(r"age\s+(\d{1,3})\s*[--]\s*(\d{1,3})", query, re.IGNORECASE)
        if not match:
            match = re.search(r"between\s+age\s+(\d{1,3})\s*(?:and|to|-)\s*(\d{1,3})", query, re.IGNORECASE)
        return (int(match.group(1)), int(match.group(2))) if match else None

    def extract_year_range(self, query: str) -> tuple[int, int] | None:
        years = [int(year) for year in re.findall(r"\b(19\d{2}|20\d{2})\b", query)]
        if len(years) >= 2:
            return min(years), max(years)
        if len(years) == 1:
            return years[0], years[0]
        return None

    def find_memories(
        self,
        db: Session,
        user_id: str,
        person: str | None,
        year_start: int | None,
        year_end: int | None,
    ):
        query = db.query(Memory).filter(Memory.user_id == user_id, Memory.status == "completed")
        if person:
            like = f"%{person}%"
            query = query.filter(
                Memory.summary.ilike(like) | Memory.raw_text.ilike(like) | Memory.title.ilike(like)
            )
        if year_start is not None and year_end is not None:
            query = query.join(TimelineEvent, TimelineEvent.memory_id == Memory.id).filter(
                TimelineEvent.year >= year_start,
                TimelineEvent.year <= year_end,
            )
        rows = query.order_by(Memory.created_at.desc()).limit(12).all()
        return [self.memory_service.record_from_db(row) for row in rows]

    def find_relationships(self, db: Session, user_id: str, person: str | None) -> list[dict[str, str]]:
        query = db.query(Relationship).filter(Relationship.user_id == user_id)
        if person:
            like = f"%{person}%"
            query = query.filter(Relationship.source_id.ilike(like) | Relationship.target_id.ilike(like))
        rows = query.limit(30).all()
        return [
            {
                "source": row.source_id,
                "relation": row.relation,
                "target": row.target_id,
            }
            for row in rows
        ]

    def build_timeline(
        self,
        db: Session,
        user_id: str,
        memories,
        year_start: int | None,
        year_end: int | None,
    ) -> list[dict]:
        memory_ids = [memory.memory_id for memory in memories]
        if not memory_ids:
            return []
        query = db.query(TimelineEvent).filter(TimelineEvent.user_id == user_id, TimelineEvent.memory_id.in_(memory_ids))
        if year_start is not None and year_end is not None:
            query = query.filter(TimelineEvent.year >= year_start, TimelineEvent.year <= year_end)
        rows = query.order_by(TimelineEvent.year.asc(), TimelineEvent.created_at.asc()).all()
        return [
            {
                "year": row.year,
                "date_text": row.date_text,
                "label": row.label,
                "memory_id": row.memory_id,
            }
            for row in rows
        ]
