import re
import uuid
from pathlib import Path

import boto3
from botocore.config import Config

from app.core.config import get_settings
from app.storage.base import StorageBackend


class R2StorageBackend(StorageBackend):
    """Cloudflare R2 storage via S3-compatible API."""

    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.CLOUDFLARE_R2_BUCKET
        self.public_base_url = settings.CLOUDFLARE_R2_PUBLIC_URL.rstrip("/")
        endpoint = f"https://{settings.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.CLOUDFLARE_R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def _safe_key(self, original: str) -> str:
        ext = Path(original).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
            ext = ".jpg"
        return f"products/{uuid.uuid4().hex}{ext}"

    def _url_to_key(self, file_url: str) -> str:
        key = file_url.replace(self.public_base_url + "/", "").lstrip("/")
        return re.sub(r"\.\.", "", key)

    def get_public_url(self, key: str) -> str:
        return f"{self.public_base_url}/{key}"

    async def save(self, file_data: bytes, filename: str, content_type: str) -> str:
        key = self._safe_key(filename)
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=file_data,
            ContentType=content_type,
        )
        return self.get_public_url(key)

    async def delete(self, file_url: str) -> bool:
        key = self._url_to_key(file_url)
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    async def exists(self, file_url: str) -> bool:
        key = self._url_to_key(file_url)
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    async def read(self, file_url: str) -> bytes | None:
        key = self._url_to_key(file_url)
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
            return response["Body"].read()
        except Exception:
            return None
