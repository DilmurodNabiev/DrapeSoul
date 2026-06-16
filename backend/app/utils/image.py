import io
from typing import Tuple

from PIL import Image

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_image(content_type: str, data: bytes, max_bytes: int) -> Tuple[bool, str]:
    if content_type not in ALLOWED_CONTENT_TYPES:
        return False, "Invalid image type. Allowed: jpg, png, webp"
    if len(data) > max_bytes:
        return False, f"File too large. Max size: {max_bytes // (1024 * 1024)}MB"
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
    except Exception:
        return False, "Invalid or corrupted image file"
    return True, ""


def compress_image(data: bytes, content_type: str, max_dimension: int = 2000, quality: int = 85) -> Tuple[bytes, str]:
    img = Image.open(io.BytesIO(data))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    width, height = img.size
    if max(width, height) > max_dimension:
        ratio = max_dimension / max(width, height)
        img = img.resize((int(width * ratio), int(height * ratio)), Image.Resampling.LANCZOS)

    output = io.BytesIO()
    fmt = "JPEG"
    out_type = "image/jpeg"
    if content_type == "image/png":
        fmt = "PNG"
        out_type = "image/png"
    elif content_type == "image/webp":
        fmt = "WEBP"
        out_type = "image/webp"

    save_kwargs = {"optimize": True}
    if fmt == "JPEG":
        save_kwargs["quality"] = quality
    elif fmt == "WEBP":
        save_kwargs["quality"] = quality

    img.save(output, format=fmt, **save_kwargs)
    return output.getvalue(), out_type
