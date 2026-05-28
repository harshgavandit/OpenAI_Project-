from .extraction import ExtractionService
from .storage import StorageService
from .upload import UploadService
from .enrichment import EnrichmentService
from app.db import SessionLocal
from app.models.memory import MemoryMetadata, MemoryRecord, StructuredMemory
from app.models.database import Media, Memory, Relationship, Subscription, TimelineEvent
from datetime import datetime, timezone
from fastapi import UploadFile
from sqlalchemy import false, or_
from sqlalchemy.orm import Session
import re

class MemoryService:
    def __init__(self):
        self.uploads = UploadService()
        self.extractor = ExtractionService()
        self.storage = StorageService()
        self.enrichment = EnrichmentService()

    async def create_pending_memory(self, file: UploadFile, user_id: str, db: Session) -> Memory:
        memory_id, metadata = await self.uploads.save_upload(file)
        now = datetime.now(timezone.utc)
        memory = Memory(
            id=memory_id,
            user_id=user_id,
            title=metadata.original_filename,
            summary="",
            raw_text="",
            structured_data=StructuredMemory().model_dump(),
            metadata_json=metadata.model_dump(mode="json"),
            status="pending",
            processing_stage="uploaded",
            created_at=now,
            updated_at=now,
        )
        db.add(memory)
        db.add(
            Media(
                user_id=user_id,
                memory_id=memory_id,
                original_filename=metadata.original_filename,
                storage_provider=self.uploads.storage_provider.name,
                storage_path=metadata.file_path,
                content_type=metadata.content_type,
                file_size=metadata.file_size,
                metadata_json={},
            )
        )
        db.commit()
        db.refresh(memory)
        return memory

    async def upload_and_process_memory(self, file: UploadFile, user_id: str | None = None, db: Session | None = None) -> MemoryRecord:
        if not db or not user_id:
            raise ValueError("Authenticated user and database session are required")
        memory = await self.create_pending_memory(file, user_id, db)
        self.process_memory_job(memory.id, user_id)
        refreshed = db.get(Memory, memory.id)
        return self.record_from_db(refreshed)

    def process_memory_job(self, memory_id: str, user_id: str):
        db = SessionLocal()
        try:
            memory = db.get(Memory, memory_id)
            if not memory or memory.user_id != user_id:
                return

            media = db.query(Media).filter(Media.memory_id == memory_id, Media.user_id == user_id).first()
            if not media:
                self.mark_failed(db, memory, "metadata", "No media file found")
                return

            self.set_stage(db, memory, "processing", "metadata")
            metadata = MemoryMetadata(**memory.metadata_json)
            metadata.image_metadata = self.extractor.extract_image_metadata(media.storage_path)
            media.metadata_json = metadata.image_metadata
            memory.metadata_json = metadata.model_dump(mode="json")

            self.set_stage(db, memory, "processing", "content_extraction")
            raw_text = self.extractor.extract_text(media.storage_path)

            self.set_stage(db, memory, "processing", "ai_enrichment")
            structured_data = self.enrichment.enrich_text(raw_text or metadata.original_filename)
            record = MemoryRecord(
                memory_id=memory.id,
                user_id=user_id,
                metadata=metadata,
                raw_text=raw_text,
                structured_data=structured_data,
                status="processing",
                processing_stage="relationship_processing",
                created_at=memory.created_at,
                updated_at=datetime.now(timezone.utc),
            )

            self.set_stage(db, memory, "processing", "relationship_processing")
            self.save_memory_to_database(db, record)

            self.set_stage(db, memory, "processing", "indexing")
            self.storage.index_memory(record)

            self.set_stage(db, memory, "completed", "completed")
        except Exception as exc:
            memory = db.get(Memory, memory_id)
            if memory:
                self.mark_failed(db, memory, "failed", str(exc))
        finally:
            db.close()

    def set_stage(self, db: Session, memory: Memory, status: str, stage: str):
        memory.status = status
        memory.processing_stage = stage
        memory.processing_error = None
        memory.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(memory)

    def mark_failed(self, db: Session, memory: Memory, stage: str, error: str):
        memory.status = "failed"
        memory.processing_stage = stage
        memory.processing_error = error
        memory.updated_at = datetime.now(timezone.utc)
        db.commit()

    def record_from_db(self, memory: Memory) -> MemoryRecord:
        return MemoryRecord(
            memory_id=memory.id,
            user_id=memory.user_id,
            metadata=MemoryMetadata(**memory.metadata_json),
            raw_text=memory.raw_text,
            structured_data=StructuredMemory(**(memory.structured_data or {})),
            status=memory.status,
            processing_stage=memory.processing_stage,
            processing_error=memory.processing_error,
            created_at=memory.created_at,
            updated_at=memory.updated_at,
        )

    def list_memories(self, db: Session, user_id: str, limit: int = 50) -> list[MemoryRecord]:
        rows = (
            db.query(Memory)
            .filter(Memory.user_id == user_id)
            .order_by(Memory.created_at.desc())
            .limit(limit)
            .all()
        )
        return [self.record_from_db(row) for row in rows]

    def get_memory(self, db: Session, memory_id: str, user_id: str) -> MemoryRecord | None:
        row = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == user_id).first()
        return self.record_from_db(row) if row else None

    def search_memories(self, db: Session, user_id: str, query: str, limit: int = 8) -> list[MemoryRecord]:
        if not query.strip():
            return self.list_memories(db, user_id, limit)

        like = f"%{query.lower()}%"
        index_ids = self.storage.search_index_ids(query, limit=limit, user_id=user_id)
        filters = [
            Memory.user_id == user_id,
            or_(
                Memory.raw_text.ilike(like),
                Memory.summary.ilike(like),
                Memory.title.ilike(like),
                Memory.id.in_(index_ids) if index_ids else false(),
            ),
        ]
        rows = (
            db.query(Memory)
            .filter(*filters)
            .order_by(Memory.updated_at.desc())
            .limit(limit)
            .all()
        )
        return [self.record_from_db(row) for row in rows]

    def save_memory_to_database(self, db: Session, record: MemoryRecord):
        memory = db.get(Memory, record.memory_id)
        if not memory:
            raise ValueError("Memory row not found")
        memory.title = record.metadata.original_filename
        memory.summary = record.structured_data.summary
        memory.raw_text = record.raw_text
        memory.structured_data = record.structured_data.model_dump()
        memory.metadata_json = record.metadata.model_dump(mode="json")
        memory.updated_at = datetime.now(timezone.utc)

        relationships = []
        for person in record.structured_data.people:
            relationships.append(("person", person, "MENTIONED_IN", "memory", record.memory_id))
        for place in record.structured_data.places:
            relationships.append(("place", place, "LOCATION_OF", "memory", record.memory_id))
        for event in record.structured_data.events:
            relationships.append(("event", event, "EVENT_IN", "memory", record.memory_id))
        for date_value in record.structured_data.dates:
            relationships.append(("memory", record.memory_id, "DATE_OF", "date", date_value))

        db.query(Relationship).filter(
            Relationship.user_id == record.user_id,
            or_(Relationship.target_id == record.memory_id, Relationship.source_id == record.memory_id),
        ).delete()
        db.query(TimelineEvent).filter(TimelineEvent.user_id == record.user_id, TimelineEvent.memory_id == record.memory_id).delete()

        for date_value in record.structured_data.dates:
            for year in re.findall(r"\b(19\d{2}|20\d{2})\b", date_value):
                db.add(
                    TimelineEvent(
                        user_id=record.user_id or "",
                        memory_id=record.memory_id,
                        label=record.structured_data.summary or record.metadata.original_filename,
                        year=int(year),
                        date_text=date_value,
                    )
                )

        for source_type, source_id, relation, target_type, target_id in relationships:
            existing = (
                db.query(Relationship)
                .filter(
                    Relationship.user_id == record.user_id,
                    Relationship.source_type == source_type,
                    Relationship.source_id == source_id,
                    Relationship.relation == relation,
                    Relationship.target_type == target_type,
                    Relationship.target_id == target_id,
                )
                .first()
            )
            if not existing:
                db.add(
                    Relationship(
                        user_id=record.user_id or "",
                        source_type=source_type,
                        source_id=source_id,
                        relation=relation,
                        target_type=target_type,
                        target_id=target_id,
                    )
                )

        subscription = db.query(Subscription).filter(Subscription.user_id == record.user_id).first()
        if subscription:
            media_bytes = (
                db.query(Media)
                .filter(Media.user_id == record.user_id)
                .with_entities(Media.file_size)
                .all()
            )
            subscription.current_storage_bytes = sum(row[0] for row in media_bytes)

        db.commit()

    def create_text_memory(self, db: Session, user_id: str, title: str, text: str) -> MemoryRecord:
        now = datetime.now(timezone.utc)
        memory_id = f"demo-{abs(hash((user_id, title, text))) % 10_000_000_000}"
        metadata = MemoryMetadata(
            upload_date=now,
            original_filename=title,
            stored_filename=title,
            file_path=f"demo://{title}",
            content_type="text/plain",
            file_size=len(text.encode("utf-8")),
            extension=".txt",
            image_metadata={},
        )
        structured = self.enrichment.enrich_text(text)
        memory = Memory(
            id=memory_id,
            user_id=user_id,
            title=title,
            summary=structured.summary,
            raw_text=text,
            structured_data=structured.model_dump(),
            metadata_json=metadata.model_dump(mode="json"),
            status="completed",
            processing_stage="completed",
            processing_error=None,
            created_at=now,
            updated_at=now,
        )
        db.merge(memory)
        existing_media = db.query(Media).filter(Media.memory_id == memory_id, Media.user_id == user_id).first()
        if not existing_media:
            db.add(
                Media(
                    user_id=user_id,
                    memory_id=memory_id,
                    original_filename=title,
                    storage_provider="demo",
                    storage_path=f"demo://{title}",
                    content_type="text/plain",
                    file_size=metadata.file_size,
                    metadata_json={},
                )
            )
        record = MemoryRecord(
            memory_id=memory_id,
            user_id=user_id,
            metadata=metadata,
            raw_text=text,
            structured_data=structured,
            status="completed",
            processing_stage="completed",
            created_at=now,
            updated_at=now,
        )
        self.save_memory_to_database(db, record)
        self.storage.index_memory(record)
        return record

    def seed_demo_memories(self, db: Session, user_id: str) -> list[MemoryRecord]:
        """Seed ultra-impressive demo data with interconnected relationships."""
        from demo_datasets import DEMO_DATASETS
        import random
        
        records = []
        
        # Pick one of the rich demo datasets at random
        dataset_key = random.choice(list(DEMO_DATASETS.keys()))
        dataset = DEMO_DATASETS[dataset_key]
        
        # Create memory records for each memory in the dataset
        for memory_data in dataset["memories"]:
            record = self.create_text_memory(
                db,
                user_id,
                memory_data["title"],
                memory_data["raw_text"]
            )
            records.append(record)
        
        # Add relationships between entities (people, places, events)
        for source_type, source_id, relation, target_type, target_id in dataset.get("relationships", []):
            existing = (
                db.query(Relationship)
                .filter(
                    Relationship.user_id == user_id,
                    Relationship.source_type == source_type,
                    Relationship.source_id == source_id,
                    Relationship.relation == relation,
                    Relationship.target_type == target_type,
                    Relationship.target_id == target_id,
                )
                .first()
            )
            if not existing:
                db.add(
                    Relationship(
                        user_id=user_id,
                        source_type=source_type,
                        source_id=source_id,
                        relation=relation,
                        target_type=target_type,
                        target_id=target_id,
                    )
                )
        
        db.commit()
        return records

    async def process_memory(self, memory_id: str, file_path: str):
        text = self.extractor.extract_text(file_path)
        if not text:
            return {"error": "No text could be extracted"}

        self.storage.save_semantic_memory(memory_id, text)
        return {"status": "processed", "text_length": len(text)}

    async def enrich_memory(self, memory_id: str, file_path: str):
        text = self.extractor.extract_text(file_path)
        if not text:
            return {"error": "No text found for enrichment"}

        structured_data = self.enrichment.enrich_text(text)

        for person in structured_data.people:
            self.storage.save_graph_relationship(person, "MENTIONED_IN", memory_id)
        for place in structured_data.places:
            self.storage.save_graph_relationship(place, "LOCATION_OF", memory_id)
        for event in structured_data.events:
            self.storage.save_graph_relationship(event, "EVENT_IN", memory_id)

        return {
            "memory_id": memory_id,
            "structured_data": structured_data.model_dump()
        }
