from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Poster(Base):
    __tablename__ = "posters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500))
    link_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
