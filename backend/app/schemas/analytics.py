from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    total_revenue: Decimal
    total_products: int
    total_customers: int
    visits_today: int


class VisitStat(BaseModel):
    visit_date: date
    page_path: str
    visit_count: int
    unique_visitors: int
    source: Optional[str] = None

    model_config = {"from_attributes": True}


class RevenueByDay(BaseModel):
    date: date
    revenue: Decimal
    order_count: int


class AnalyticsOverview(BaseModel):
    stats: DashboardStats
    recent_visits: List[VisitStat]
    revenue_by_day: List[RevenueByDay]
