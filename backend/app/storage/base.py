from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageBackend(ABC):
    """Abstract storage layer. Swap implementations without changing API contract."""

    @abstractmethod
    async def save(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Save file and return public URL."""

    @abstractmethod
    async def delete(self, file_url: str) -> bool:
        """Delete file by URL."""

    @abstractmethod
    async def exists(self, file_url: str) -> bool:
        """Check if file exists."""

    @abstractmethod
    def get_public_url(self, key: str) -> str:
        """Build public URL from storage key."""

    async def read(self, file_url: str) -> bytes | None:
        """Read file bytes by public URL. Returns None if not found."""
        return None
