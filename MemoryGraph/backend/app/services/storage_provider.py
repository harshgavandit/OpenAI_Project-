import os
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile


class StoredFile:
    def __init__(self, provider: str, path: str, filename: str, size: int):
        self.provider = provider
        self.path = path
        self.filename = filename
        self.size = size


class LocalStorageProvider:
    name = "local"

    def __init__(self, upload_dir: str = "backend/data/uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, memory_id: str | None = None) -> StoredFile:
        memory_id = memory_id or str(uuid.uuid4())
        extension = os.path.splitext(file.filename or "")[1]
        stored_filename = f"{memory_id}{extension}"
        path = self.upload_dir / stored_filename
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return StoredFile(self.name, str(path), stored_filename, path.stat().st_size)


def get_storage_provider():
    return LocalStorageProvider()
