import html
import json
import logging
from typing import List, Optional, Tuple

import httpx

from app.core.config import get_settings
from app.storage import get_storage_backend
from app.utils.image import compress_image

logger = logging.getLogger(__name__)

TELEGRAM_MAX_PHOTOS = 10
TELEGRAM_PHOTO_MAX_BYTES = 9 * 1024 * 1024


def _parse_telegram_response(response: httpx.Response) -> Tuple[bool, str]:
    try:
        data = response.json()
    except Exception:
        return False, f"Invalid Telegram response (HTTP {response.status_code})"
    if data.get("ok"):
        return True, ""
    description = data.get("description") or "Unknown Telegram error"
    logger.error("Telegram API error: %s", description)
    return False, description


async def _load_image_bytes(image_url: str, client: httpx.AsyncClient) -> bytes | None:
    storage = get_storage_backend()
    data = await storage.read(image_url)
    if data:
        return data

    try:
        img_resp = await client.get(image_url)
        if img_resp.status_code == 200 and img_resp.content:
            return img_resp.content
    except Exception as e:
        logger.warning("Could not download image %s: %s", image_url, e)
    return None


def _prepare_telegram_photo(data: bytes) -> bytes | None:
    try:
        compressed, _ = compress_image(data, "image/jpeg", max_dimension=1280, quality=85)
        if len(compressed) > TELEGRAM_PHOTO_MAX_BYTES:
            compressed, _ = compress_image(data, "image/jpeg", max_dimension=960, quality=75)
        return compressed if len(compressed) <= TELEGRAM_PHOTO_MAX_BYTES else None
    except Exception as e:
        logger.warning("Could not prepare image for Telegram: %s", e)
        return None


async def send_telegram_message(chat_id: int | str, text: str, parse_mode: str = "HTML") -> bool:
    settings = get_settings()
    if not settings.BOT_TOKEN:
        logger.warning("BOT_TOKEN not configured, skipping notification")
        return False

    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                url,
                json={"chat_id": chat_id, "text": text, "parse_mode": parse_mode},
            )
            ok, _ = _parse_telegram_response(response)
            return ok
    except Exception as e:
        logger.error("Failed to send Telegram message: %s", e)
        return False


async def notify_new_order(
    order_number: str,
    customer_name: str,
    total: str,
    admin_telegram_ids: list[int],
    owner_telegram_id: Optional[int] = None,
    payment_method: str = "contact",
    receipt_url: Optional[str] = None,
) -> None:
    payment_label = "📞 Contact to confirm" if payment_method == "contact" else "💳 Bank transfer"
    text = (
        f"🛍 <b>New Order</b>\n"
        f"Order: <code>{order_number}</code>\n"
        f"Customer: {html.escape(customer_name)}\n"
        f"Total: {total}\n"
        f"Payment: {payment_label}"
    )
    if receipt_url:
        text += f"\nReceipt: {receipt_url}"
    recipients = set(admin_telegram_ids)
    if owner_telegram_id:
        recipients.add(owner_telegram_id)
    for chat_id in recipients:
        await send_telegram_message(chat_id, text)


async def notify_order_status(customer_telegram_id: int, order_number: str, status: str) -> None:
    status_labels = {
        "pending": "⏳ Pending",
        "accepted": "✅ Accepted",
        "preparing": "👔 Preparing",
        "delivered": "🚚 Delivered",
        "rejected": "❌ Rejected",
        "cancelled": "🚫 Cancelled",
    }
    label = status_labels.get(status, status)
    text = f"Order <code>{order_number}</code>\nStatus updated: <b>{label}</b>"
    await send_telegram_message(customer_telegram_id, text)


async def publish_product_to_channel(
    product_name: str,
    price: str,
    image_urls: List[str],
    product_url: str,
) -> Tuple[bool, str]:
    settings = get_settings()
    if not settings.BOT_TOKEN:
        return False, "BOT_TOKEN is not configured in server settings"
    if not settings.TELEGRAM_CHANNEL_ID:
        return False, "TELEGRAM_CHANNEL_ID is not configured in server settings"

    safe_name = html.escape(product_name)
    caption = f"✨ <b>{safe_name}</b>\n💰 {price}\n\n🛍 <a href='{product_url}'>Shop Now</a>"
    api_base = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"
    chat_id = settings.TELEGRAM_CHANNEL_ID

    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            photos: list[bytes] = []
            failed_urls: list[str] = []

            for url in image_urls[:TELEGRAM_MAX_PHOTOS]:
                raw = await _load_image_bytes(url, client)
                if not raw:
                    failed_urls.append(url)
                    continue
                prepared = _prepare_telegram_photo(raw)
                if prepared:
                    photos.append(prepared)
                else:
                    failed_urls.append(url)

            if not photos:
                if image_urls:
                    response = await client.post(
                        f"{api_base}/sendMessage",
                        json={"chat_id": chat_id, "text": caption, "parse_mode": "HTML"},
                    )
                    ok, detail = _parse_telegram_response(response)
                    if ok:
                        return True, "Posted without photos — could not load product images"
                    return False, detail or "Could not load product images for Telegram"

                response = await client.post(
                    f"{api_base}/sendMessage",
                    json={"chat_id": chat_id, "text": caption, "parse_mode": "HTML"},
                )
                return _parse_telegram_response(response)

            if len(photos) == 1:
                response = await client.post(
                    f"{api_base}/sendPhoto",
                    data={"chat_id": chat_id, "caption": caption, "parse_mode": "HTML"},
                    files={"photo": ("product.jpg", photos[0], "image/jpeg")},
                )
                ok, detail = _parse_telegram_response(response)
            else:
                media = []
                files = {}
                for i, photo in enumerate(photos):
                    attach_name = f"photo{i}"
                    files[attach_name] = (f"product{i}.jpg", photo, "image/jpeg")
                    item: dict = {"type": "photo", "media": f"attach://{attach_name}"}
                    if i == 0:
                        item["caption"] = caption
                        item["parse_mode"] = "HTML"
                    media.append(item)

                response = await client.post(
                    f"{api_base}/sendMediaGroup",
                    data={"chat_id": chat_id, "media": json.dumps(media)},
                    files=files,
                )
                ok, detail = _parse_telegram_response(response)

            if ok and failed_urls:
                return True, f"Published {len(photos)} photo(s); {len(failed_urls)} image(s) could not be loaded"
            return ok, detail

    except Exception as e:
        logger.error("Failed to publish to channel: %s", e)
        return False, str(e)
