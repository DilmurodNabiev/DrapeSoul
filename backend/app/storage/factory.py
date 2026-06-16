from functools import lru_cache

from app.core.config import get_settings
from app.storage.base import StorageBackend
from app.storage.local import LocalStorageBackend
from app.storage.r2 import R2StorageBackend


@lru_cache
def get_storage_backend() -> StorageBackend:
    settings = get_settings()
    if settings.STORAGE_BACKEND.lower() == "r2":
        return R2StorageBackend()
    return LocalStorageBackend()
