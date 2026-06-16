import os
import shutil
from datetime import datetime, timezone

import psutil
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import VisitAnalytics
from app.models.audit import AuditLog
from app.models.customer import Customer
from app.models.logs import SystemLog
from app.models.order import Order
from app.models.product import Product
from app.services.storage_stats import delete_file_url, get_storage_usage, purge_storage


def get_server_stats() -> dict:
    cpu_percent = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    disk = shutil.disk_usage("/")

    load_avg = None
    if hasattr(os, "getloadavg"):
        load1, load5, load15 = os.getloadavg()
        load_avg = {"1m": load1, "5m": load5, "15m": load15}

    return {
        "cpu_percent": cpu_percent,
        "memory_total_mb": round(mem.total / 1024 / 1024, 1),
        "memory_used_mb": round(mem.used / 1024 / 1024, 1),
        "memory_available_mb": round(mem.available / 1024 / 1024, 1),
        "memory_percent": mem.percent,
        "disk_total_gb": round(disk.total / 1024 ** 3, 2),
        "disk_used_gb": round(disk.used / 1024 ** 3, 2),
        "disk_free_gb": round(disk.free / 1024 ** 3, 2),
        "disk_percent": round((disk.used / disk.total) * 100, 1) if disk.total else 0,
        "load_average": load_avg,
    }


async def get_data_counts(db: AsyncSession) -> dict:
    orders = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    products = (await db.execute(select(func.count(Product.id)))).scalar() or 0
    customers = (await db.execute(select(func.count(Customer.id)))).scalar() or 0
    visits = (await db.execute(select(func.count(VisitAnalytics.id)))).scalar() or 0
    audit_logs = (await db.execute(select(func.count(AuditLog.id)))).scalar() or 0
    system_logs = (await db.execute(select(func.count(SystemLog.id)))).scalar() or 0
    return {
        "orders": orders,
        "products": products,
        "customers": customers,
        "visit_analytics": visits,
        "audit_logs": audit_logs,
        "system_logs": system_logs,
    }


async def delete_order_with_receipt(db: AsyncSession, order: Order) -> None:
    if order.payment_receipt_url:
        await delete_file_url(order.payment_receipt_url)
    await db.delete(order)


async def clear_orders(db: AsyncSession) -> dict:
    result = await db.execute(select(Order))
    orders = result.scalars().all()
    receipts_deleted = 0
    for order in orders:
        if order.payment_receipt_url:
            if await delete_file_url(order.payment_receipt_url):
                receipts_deleted += 1
    count = len(orders)
    if count:
        await db.execute(delete(Order))
    return {"orders_deleted": count, "receipts_deleted": receipts_deleted}


async def clear_analytics(db: AsyncSession) -> int:
    result = await db.execute(delete(VisitAnalytics))
    return result.rowcount or 0


async def clear_logs(db: AsyncSession) -> dict:
    audit = await db.execute(delete(AuditLog))
    system = await db.execute(delete(SystemLog))
    return {
        "audit_logs_deleted": audit.rowcount or 0,
        "system_logs_deleted": system.rowcount or 0,
    }


async def clear_customers(db: AsyncSession) -> int:
    result = await db.execute(delete(Customer))
    return result.rowcount or 0
