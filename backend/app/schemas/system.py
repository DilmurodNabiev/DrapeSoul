from typing import Optional

from pydantic import BaseModel


class ClearDataRequest(BaseModel):
    confirm_text: str
    clear_orders: bool = False
    clear_analytics: bool = False
    clear_logs: bool = False
    clear_customers: bool = False
    clear_r2: bool = False


class SystemStatsResponse(BaseModel):
    status: str
    database: str
    timestamp: str
    storage: dict
    server: dict
    counts: dict
