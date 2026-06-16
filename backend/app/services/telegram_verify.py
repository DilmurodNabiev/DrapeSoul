import hashlib
import hmac
import json
import time
from typing import Optional
from urllib.parse import parse_qsl

from app.core.config import get_settings


def verify_telegram_init_data(init_data: str, max_age_seconds: int = 86400) -> Optional[dict]:
    """
    Verify Telegram WebApp initData per official docs.
    NEVER trust frontend - always validate server-side.
    """
    settings = get_settings()
    if not settings.BOT_TOKEN or not init_data:
        return None

    try:
        parsed = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = parsed.pop("hash", None)
        if not received_hash:
            return None

        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
        secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(computed_hash, received_hash):
            return None

        auth_date = int(parsed.get("auth_date", 0))
        if time.time() - auth_date > max_age_seconds:
            return None

        user_data = json.loads(parsed.get("user", "{}"))
        return {
            "telegram_id": user_data.get("id"),
            "username": user_data.get("username"),
            "first_name": user_data.get("first_name"),
            "last_name": user_data.get("last_name"),
            "auth_date": auth_date,
        }
    except (ValueError, json.JSONDecodeError, KeyError):
        return None
