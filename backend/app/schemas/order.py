from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    product_id: int
    size: str
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    telegram_username: Optional[str] = None
    comment: Optional[str] = None
    delivery_method: str = "delivery"
    payment_method: str = "contact"
    items: List[OrderItemCreate]
    telegram_init_data: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    size: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_phone: str
    customer_address: str
    telegram_username: Optional[str] = None
    comment: Optional[str] = None
    delivery_method: str
    payment_method: str = "contact"
    payment_receipt_url: Optional[str] = None
    status: str
    total_amount: Decimal
    items: List[OrderItemResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str
