from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "DrapeSoul"
    ENV: str = "development"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://drapesoul:drapesoul_secret@localhost:5432/drapesoul"

    SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OWNER_TELEGRAM_ID: int = 0
    ORDER_RECEIVER_TELEGRAM_ID: int = 0
    OWNER_PASSWORD_HASH: str = ""

    PAYMENT_CARD_NUMBER: str = "8600 1234 5678 9012"
    PAYMENT_CARD_HOLDER: str = "DRAPESOUL LLC"

    BOT_TOKEN: str = ""
    TELEGRAM_CHANNEL_ID: str = ""
    WEBAPP_URL: str = "http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "static/uploads/products"
    CATEGORY_UPLOAD_DIR: str = "static/uploads/categories"
    RECEIPTS_UPLOAD_DIR: str = "static/uploads/receipts"
    MAX_UPLOAD_MB: int = 5
    PUBLIC_MEDIA_URL: str = "http://localhost:8000/static/uploads/products"

    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_R2_BUCKET: str = ""
    CLOUDFLARE_R2_ACCESS_KEY_ID: str = ""
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: str = ""
    CLOUDFLARE_R2_PUBLIC_URL: str = ""
    CLOUDFLARE_ZONE_ID: str = ""
    CLOUDFLARE_API_TOKEN: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
