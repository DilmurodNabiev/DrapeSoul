from app.core.config import get_settings
from fastapi import APIRouter

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/checkout")
async def get_checkout_settings():
    settings = get_settings()
    return {
        "payment_card_number": settings.PAYMENT_CARD_NUMBER,
        "payment_card_holder": settings.PAYMENT_CARD_HOLDER,
    }
