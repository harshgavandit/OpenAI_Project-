# Updated by GitHub contribution automation.
import json
import re

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.database import Memory, Relationship, TimelineEvent
from app.models.memory import TimeMachineResponse
from app.services.enrichment import EnrichmentService
from app.services.memory import MemoryService
from app.services.memory_proof import proofs_for_memory_ids

PERSON_ALIASES: dict[str, list[str]] = {
    "father": ["Father", "Dad"],
    "mother": ["Mother", "Mom"],
    "grandfather": ["Grandfather"],
    "grandmother": ["Grandmother"],
    "dad": ["Father", "Dad"],
    "mom": ["Mother", "Mom"],
}

PERSON_KEYWORDS = [
    "grandfather",
    "grandmother",
    "father",
    "mother",
    "dad",
    "mom",
]


class TimeMachineService:
    def __init__(self, memory_service: MemoryService | None = None):
        self.memory_service = memory_service or MemoryService()
        self.enrichment = EnrichmentService()

    def query(self, db: Session, user_id: str, query: str, birth_year: int | None = None) -> TimeMachineResponse:
        normalized_query = query.replace("\u2013", "-").replace("\u2014", "-")
        person = self.extract_person(normalized_query)
        age_range = self.extract_age_range(normalized_query)
        year_range = self.extract_year_range(normalized_query)

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
            narrative = (
                f"I can build this Time Machine view for {self._display_person(person)}, but I need their birth year "
                f"to translate age {age_range[0]}-{age_range[1]} into calendar years."
            )
        elif memories:
            narrative = self.enrichment.synthesize_answer(query, summaries, relationship_text)
        elif person and year_start is not None:
            narrative = (
                f"I found memories about {self._display_person(person)}, but none with timeline years between "
                f"{year_start} and {year_end}. Try widening the age range or add more dated memories from that period."
            )
        else:
            narrative = (
                "I could not find enough connected memories for that Time Machine view yet. "
                "Load the sample family on Home or upload memories that mention the person and include years."
            )

        proofs = proofs_for_memory_ids(db, user_id, [item.memory_id for item in memories])

        return TimeMachineResponse(
            query=query,
            needs_birth_year=needs_birth_year,
            resolved_person=self._display_person(person),
            year_start=year_start,
            year_end=year_end,
            narrative=narrative,
            timeline=timeline,
            memories=memories,
            relationships=relationships,
            proofs=proofs,
        )

    def _display_person(self, person: str | None) -> str | None:
        if not person:
            return None
        aliases = PERSON_ALIASES.get(person.lower())
        return aliases[0] if aliases else person.title()

    def extract_person(self, query: str) -> str | None:
        lowered = query.lower()
        for candidate in PERSON_KEYWORDS:
            if re.search(rf"\b{re.escape(candidate)}\b", lowered):
                return candidate
        match = re.search(r"\b(?:for|about)\s+my\s+([a-zA-Z]+)", query, re.IGNORECASE)
        return match.group(1).lower() if match else None

    def extract_age_range(self, query: str) -> tuple[int, int] | None:
        patterns = [
            r"age\s+(\d{1,3})\s*[-–—]\s*(\d{1,3})",
            r"between\s+age\s+(\d{1,3})\s*(?:and|to|-)\s*(\d{1,3})",
            r"ages?\s+(\d{1,3})\s*(?:and|to|-)\s*(\d{1,3})",
        ]
        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                start, end = int(match.group(1)), int(match.group(2))
                return (start, end) if start <= end else (end, start)
        return None

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
        rows = self._query_memories(db, user_id, person, year_start, year_end)
        if not rows and person and year_start is not None and year_end is not None:
            person_rows = self._query_memories(db, user_id, person, None, None)
            rows = self._filter_rows_by_year(db, user_id, person_rows, year_start, year_end)
        if not rows and year_start is not None and year_end is not None:
            rows = self._query_memories(db, user_id, None, year_start, year_end)
        if not rows and person:
            rows = self._query_memories(db, user_id, person, None, None)
        return [self.memory_service.record_from_db(row) for row in rows[:12]]

    def _query_memories(
        self,
        db: Session,
        user_id: str,
        person: str | None,
        year_start: int | None,
        year_end: int | None,
    ) -> list[Memory]:
        query = db.query(Memory).filter(Memory.user_id == user_id, Memory.status == "completed")
        if person:
            query = query.filter(self._person_filter(person))
        if year_start is not None and year_end is not None:
            query = (
                query.join(TimelineEvent, TimelineEvent.memory_id == Memory.id)
                .filter(
                    TimelineEvent.user_id == user_id,
                    TimelineEvent.year >= year_start,
                    TimelineEvent.year <= year_end,
                )
                .distinct()
            )
        return query.order_by(Memory.created_at.desc()).limit(24).all()

    def _person_filter(self, person: str):
        aliases = PERSON_ALIASES.get(person.lower(), [person.title()])
        clauses = []
        for alias in aliases:
            like = f"%{alias}%"
            clauses.extend(
                [
                    Memory.title.ilike(like),
                    Memory.summary.ilike(like),
                    Memory.raw_text.ilike(like),
                    Memory.structured_data.ilike(f'%"{alias}"%'),
                ]
            )
        if person.lower() == "father":
            clauses.extend(
                [
                    Memory.structured_data.ilike('%"Father"%'),
                    Memory.title.ilike("%Father%"),
                ]
            )
        return or_(*clauses)

    def _filter_rows_by_year(
        self,
        db: Session,
        user_id: str,
        rows: list[Memory],
        year_start: int,
        year_end: int,
    ) -> list[Memory]:
        matched: list[Memory] = []
        for row in rows:
            years = self._years_for_memory(db, user_id, row)
            if any(year_start <= year <= year_end for year in years):
                matched.append(row)
        return matched

    def _years_for_memory(self, db: Session, user_id: str, memory: Memory) -> set[int]:
        years: set[int] = set()
        structured = memory.structured_data
        if isinstance(structured, str):
            try:
                structured = json.loads(structured)
            except json.JSONDecodeError:
                structured = {}
        if isinstance(structured, dict):
            for date_value in structured.get("dates", []):
                for year in re.findall(r"\b(19\d{2}|20\d{2})\b", str(date_value)):
                    years.add(int(year))
        for event in (
            db.query(TimelineEvent.year)
            .filter(TimelineEvent.user_id == user_id, TimelineEvent.memory_id == memory.id, TimelineEvent.year.isnot(None))
            .all()
        ):
            years.add(int(event[0]))
        return years

    def find_relationships(self, db: Session, user_id: str, person: str | None) -> list[dict[str, str]]:
        query = db.query(Relationship).filter(Relationship.user_id == user_id)
        if person:
            aliases = PERSON_ALIASES.get(person.lower(), [person.title()])
            clauses = []
            for alias in aliases:
                like = f"%{alias}%"
                clauses.extend([Relationship.source_id.ilike(like), Relationship.target_id.ilike(like)])
            query = query.filter(or_(*clauses))
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
        if rows:
            return [
                {
                    "year": row.year,
                    "date_text": row.date_text,
                    "label": row.label,
                    "memory_id": row.memory_id,
                }
                for row in rows
            ]
        # Fallback timeline from structured dates when events were not indexed yet.
        fallback: list[dict] = []
        for memory in memories:
            db_row = db.get(Memory, memory.memory_id)
            if not db_row:
                continue
            for year in sorted(self._years_for_memory(db, user_id, db_row)):
                if year_start is not None and year_end is not None and not (year_start <= year <= year_end):
                    continue
                fallback.append(
                    {
                        "year": year,
                        "date_text": str(year),
                        "label": memory.structured_data.summary or memory.metadata.original_filename,
                        "memory_id": memory.memory_id,
                    }
                )
        return fallback[:12]
