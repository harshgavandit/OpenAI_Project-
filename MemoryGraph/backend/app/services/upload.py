from datetime import datetime, timezone
from pathlib import Path
from fastapi import UploadFile

from app.models.memory import MemoryMetadata
from app.services.storage_provider import get_storage_provider

class UploadService:
    def __init__(self, upload_dir="backend/data/uploads"):
        self.storage_provider = get_storage_provider()

    async def save_file(self, file: UploadFile) -> tuple[str, str]:
        stored = await self.storage_provider.save(file)
        memory_id = Path(stored.filename).stem
        return memory_id, stored.path

    async def save_upload(self, file: UploadFile) -> tuple[str, MemoryMetadata]:
        stored = await self.storage_provider.save(file)
        memory_id = Path(stored.filename).stem
        path = Path(stored.path)
        metadata = MemoryMetadata(
            upload_date=datetime.now(timezone.utc),
            original_filename=file.filename or path.name,
            stored_filename=path.name,
            file_path=str(path),
            content_type=file.content_type,
            file_size=stored.size,
            extension=path.suffix.lower(),
        )
        return memory_id, metadata
