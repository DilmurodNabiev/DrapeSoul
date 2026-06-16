from typing import List, Optional

from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMeResponse(BaseModel):
    id: Optional[int] = None
    username: str
    role: str
    permissions: List[str] = Field(default_factory=list)
    telegram_id: Optional[int] = None


class TelegramVerifyRequest(BaseModel):
    init_data: str


class TelegramVerifyResponse(BaseModel):
    valid: bool
    customer_id: Optional[int] = None
    telegram_id: Optional[int] = None
    first_name: Optional[str] = None
    username: Optional[str] = None
