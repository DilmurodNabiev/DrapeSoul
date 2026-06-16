from typing import List, Optional

from pydantic import BaseModel, Field


class AdminCreate(BaseModel):
    username: str
    password: str
    telegram_id: Optional[int] = None
    permissions: List[str] = Field(default_factory=list)


class AdminUpdate(BaseModel):
    password: Optional[str] = None
    telegram_id: Optional[int] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class AdminResponse(BaseModel):
    id: int
    username: str
    telegram_id: Optional[int] = None
    permissions: List[str]
    is_active: bool

    model_config = {"from_attributes": True}
