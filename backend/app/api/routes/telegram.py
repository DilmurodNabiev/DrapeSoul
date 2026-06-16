from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.customer import Customer
from app.schemas.auth import TelegramVerifyRequest, TelegramVerifyResponse
from app.services.telegram_verify import verify_telegram_init_data

router = APIRouter(prefix="/telegram", tags=["telegram"])


@router.post("/verify-init-data", response_model=TelegramVerifyResponse)
async def verify_init_data(data: TelegramVerifyRequest, db: AsyncSession = Depends(get_db)):
    tg_user = verify_telegram_init_data(data.init_data)
    if not tg_user:
        return TelegramVerifyResponse(valid=False)

    telegram_id = tg_user.get("telegram_id")
    customer = None
    if telegram_id:
        result = await db.execute(select(Customer).where(Customer.telegram_id == telegram_id))
        customer = result.scalar_one_or_none()
        if not customer:
            customer = Customer(
                telegram_id=telegram_id,
                telegram_username=tg_user.get("username"),
                first_name=tg_user.get("first_name"),
                last_name=tg_user.get("last_name"),
            )
            db.add(customer)
            await db.flush()

    return TelegramVerifyResponse(
        valid=True,
        customer_id=customer.id if customer else None,
        telegram_id=telegram_id,
        first_name=tg_user.get("first_name"),
        username=tg_user.get("username"),
    )
