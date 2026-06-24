from typing import Optional

from pydantic import BaseModel


class PosterResponse(BaseModel):
    id: int
    title: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    sort_order: int = 0

    model_config = {"from_attributes": True}


class PosterAdminResponse(PosterResponse):
    is_active: bool = True


class PosterCreate(BaseModel):
    title: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class PosterUpdate(BaseModel):
    title: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
