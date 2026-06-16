from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VisitAnalytics(Base):
    __tablename__ = "visit_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visit_date: Mapped[date] = mapped_column(Date, index=True)
    page_path: Mapped[str] = mapped_column(String(300), index=True)
    visit_count: Mapped[int] = mapped_column(Integer, default=1)
    unique_visitors: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
