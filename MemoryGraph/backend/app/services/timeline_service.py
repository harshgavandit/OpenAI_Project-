import re
from sqlalchemy.orm import Session

from app.models.database import Memory, TimelineEvent
from app.services.memory import MemoryService

class TimelineService:
    def __init__(self, memory_service: MemoryService | None = None):
        self.memory_service = memory_service or MemoryService()

    def extract_year(self, text: str):
        # Simple regex to find years (1900-2099)
        years = re.findall(r"\b(19\d{2}|20\d{2})\b", text)
        return years[0] if years else None

    async def get_memories_in_range(self, db: Session, start_year: int, end_year: int, user_id: str):
        rows = (
            db.query(Memory)
            .join(TimelineEvent, TimelineEvent.memory_id == Memory.id)
            .filter(
                Memory.user_id == user_id,
                TimelineEvent.year >= start_year,
                TimelineEvent.year <= end_year,
            )
            .order_by(TimelineEvent.year.asc())
            .all()
        )
        return [self.memory_service.record_from_db(row).model_dump(mode="json") for row in rows]

    async def get_all_years(self, db: Session, user_id: str):
        rows = (
            db.query(TimelineEvent.year)
            .filter(TimelineEvent.user_id == user_id, TimelineEvent.year.isnot(None))
            .distinct()
            .order_by(TimelineEvent.year.asc())
            .all()
        )
        return [row[0] for row in rows]
