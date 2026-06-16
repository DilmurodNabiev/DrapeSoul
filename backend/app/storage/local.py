import os
import re
import uuid
from pathlib import Path

import aiofiles

from app.core.config import get_settings
from app.storage.base import StorageBackend


class LocalStorageBackend(StorageBackend):
    def __init__(self) -> None:
        settings = get_settings()
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.public_base_url = settings.PUBLIC_MEDIA_URL.rstrip("/")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _safe_filename(self, original: str) -> str:
        ext = Path(original).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
            ext = ".jpg"
        return f"{uuid.uuid4().hex}{ext}"

    def _url_to_path(self, file_url: str) -> Path:
        key = file_url.replace(self.public_base_url + "/", "").lstrip("/")
        key = re.sub(r"\.\.", "", key)
        return self.upload_dir / key

    def get_public_url(self, key: str) -> str:
        return f"{self.public_base_url}/{key}"

    async def save(self, file_data: bytes, filename: str, content_type: str) -> str:
        safe_name = self._safe_filename(filename)
        file_path = self.upload_dir / safe_name
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_data)
        return self.get_public_url(safe_name)

    async def delete(self, file_url: str) -> bool:
        path = self._url_to_path(file_url)
        if path.exists() and path.is_file():
            path.unlink()
            return True
        return False

    async def exists(self, file_url: str) -> bool:
        return self._url_to_path(file_url).exists()

    async def read(self, file_url: str) -> bytes | None:
        path = self._url_to_path(file_url)
        if not path.exists() or not path.is_file():
            return None
        async with aiofiles.open(path, "rb") as f:
            return await f.read()
