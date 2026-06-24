import os
from pathlib import Path
from typing import Tuple

from app.core.config import get_settings
from app.storage.factory import get_storage_backend
from app.storage.local import LocalStorageBackend
from app.storage.r2 import R2StorageBackend


def _format_bytes(num: int) -> str:
    if num < 1024:
        return f"{num} B"
    if num < 1024 ** 2:
        return f"{num / 1024:.1f} KB"
    if num < 1024 ** 3:
        return f"{num / 1024 ** 2:.1f} MB"
    return f"{num / 1024 ** 3:.2f} GB"


async def get_storage_usage() -> dict:
    settings = get_settings()
    backend = get_storage_backend()
    free_limit_bytes = settings.R2_FREE_STORAGE_GB * 1024 ** 3

    if isinstance(backend, R2StorageBackend):
        total_bytes = 0
        object_count = 0
        paginator = backend.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=backend.bucket):
            for obj in page.get("Contents", []):
                total_bytes += obj.get("Size", 0)
                object_count += 1
        backend_name = "r2"
    elif isinstance(backend, LocalStorageBackend):
        total_bytes = 0
        object_count = 0
        upload_root = Path(settings.UPLOAD_DIR).parent
        if upload_root.exists():
            for path in upload_root.rglob("*"):
                if path.is_file() and path.name != ".gitkeep":
                    total_bytes += path.stat().st_size
                    object_count += 1
        backend_name = "local"
    else:
        total_bytes = 0
        object_count = 0
        backend_name = "unknown"

    used_percent = round((total_bytes / free_limit_bytes) * 100, 1) if free_limit_bytes else 0
    return {
        "backend": backend_name,
        "used_bytes": total_bytes,
        "used_human": _format_bytes(total_bytes),
        "object_count": object_count,
        "free_limit_bytes": free_limit_bytes,
        "free_limit_human": _format_bytes(free_limit_bytes),
        "free_remaining_bytes": max(0, free_limit_bytes - total_bytes),
        "free_remaining_human": _format_bytes(max(0, free_limit_bytes - total_bytes)),
        "used_percent": min(used_percent, 100.0),
    }


async def purge_storage() -> Tuple[int, int]:
    """Delete all stored files. Returns (deleted_count, freed_bytes)."""
    backend = get_storage_backend()
    deleted = 0
    freed = 0

    if isinstance(backend, R2StorageBackend):
        paginator = backend.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=backend.bucket):
            objects = page.get("Contents", [])
            if not objects:
                continue
            for obj in objects:
                freed += obj.get("Size", 0)
            backend.client.delete_objects(
                Bucket=backend.bucket,
                Delete={"Objects": [{"Key": o["Key"]} for o in objects]},
            )
            deleted += len(objects)
    elif isinstance(backend, LocalStorageBackend):
        settings = get_settings()
        upload_root = Path(settings.UPLOAD_DIR).parent
        if upload_root.exists():
            for path in upload_root.rglob("*"):
                if path.is_file() and path.name != ".gitkeep":
                    freed += path.stat().st_size
                    path.unlink()
                    deleted += 1

    return deleted, freed


async def delete_file_url(file_url: str | None) -> bool:
    if not file_url:
        return False
    storage = get_storage_backend()
    if await storage.delete(file_url):
        return True

    settings = get_settings()
    if file_url.startswith(settings.BACKEND_URL):
        rel = file_url.replace(settings.BACKEND_URL.rstrip("/") + "/", "")
        for base in [
            Path(settings.RECEIPTS_UPLOAD_DIR),
            Path(settings.CATEGORY_UPLOAD_DIR),
            Path(settings.POSTER_UPLOAD_DIR),
            Path(settings.UPLOAD_DIR),
        ]:
            candidate = base / Path(rel).name
            if candidate.exists() and candidate.is_file():
                candidate.unlink()
                return True
    return False
