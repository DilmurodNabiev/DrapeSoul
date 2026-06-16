from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthUser, require_permission
from app.core.permissions import Permission
from app.db.session import get_db
from app.models.analytics import VisitAnalytics
from app.models.audit import AuditLog
from app.models.customer import Customer
from app.models.logs import SystemLog
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.schemas.analytics import AnalyticsOverview, DashboardStats, RevenueByDay, VisitStat
from app.schemas.system import ClearDataRequest, SystemStatsResponse
from app.services.audit import log_audit
from app.services.storage_stats import get_storage_usage, purge_storage
from app.services.system import (
    clear_analytics,
    clear_customers,
    clear_logs,
    clear_orders,
    get_data_counts,
    get_server_stats,
)

router = APIRouter(tags=["analytics"])


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def analytics_overview(
    user: AuthUser = Depends(require_permission(Permission.VIEW_STATISTICS)),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()

    total_orders = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    pending_orders = (
        await db.execute(select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING.value))
    ).scalar() or 0
    total_revenue = (await db.execute(select(func.coalesce(func.sum(Order.total_amount), 0)))).scalar() or 0
    total_products = (
        await db.execute(select(func.count(Product.id)).where(Product.is_active == True))
    ).scalar() or 0
    total_customers = (await db.execute(select(func.count(Customer.id)))).scalar() or 0
    visits_today = (
        await db.execute(
            select(func.coalesce(func.sum(VisitAnalytics.visit_count), 0)).where(
                VisitAnalytics.visit_date == today
            )
        )
    ).scalar() or 0

    visit_result = await db.execute(
        select(VisitAnalytics).order_by(VisitAnalytics.visit_date.desc()).limit(10)
    )
    recent_visits = visit_result.scalars().all()

    week_ago = today - timedelta(days=7)
    revenue_result = await db.execute(
        select(
            func.date(Order.created_at).label("order_date"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("order_count"),
        )
        .where(func.date(Order.created_at) >= week_ago)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    revenue_by_day = [
        RevenueByDay(date=row.order_date, revenue=row.revenue, order_count=row.order_count)
        for row in revenue_result.all()
    ]

    return AnalyticsOverview(
        stats=DashboardStats(
            total_orders=total_orders,
            pending_orders=pending_orders,
            total_revenue=Decimal(str(total_revenue)),
            total_products=total_products,
            total_customers=total_customers,
            visits_today=visits_today,
        ),
        recent_visits=[VisitStat.model_validate(v) for v in recent_visits],
        revenue_by_day=revenue_by_day,
    )


@router.post("/analytics/track")
async def track_visit(page_path: str, source: str | None = None, db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(
        select(VisitAnalytics).where(
            VisitAnalytics.visit_date == today, VisitAnalytics.page_path == page_path
        )
    )
    visit = result.scalar_one_or_none()
    if visit:
        visit.visit_count += 1
    else:
        db.add(VisitAnalytics(visit_date=today, page_path=page_path, visit_count=1, source=source))
    return {"tracked": True}


@router.get("/logs/audit")
async def get_audit_logs(
    limit: int = Query(50, le=200),
    user: AuthUser = Depends(require_permission(Permission.VIEW_LOGS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "actor_type": l.actor_type,
            "actor_id": l.actor_id,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]


@router.get("/system/health")
async def system_health(
    user: AuthUser = Depends(require_permission(Permission.DEVELOPER_ACCESS)),
    db: AsyncSession = Depends(get_db),
):
    try:
        await db.execute(select(1))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {e}"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/system/stats", response_model=SystemStatsResponse)
async def system_stats(
    user: AuthUser = Depends(require_permission(Permission.DEVELOPER_ACCESS)),
    db: AsyncSession = Depends(get_db),
):
    try:
        await db.execute(select(1))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {e}"

    storage = await get_storage_usage()
    server = get_server_stats()
    counts = await get_data_counts(db)

    return SystemStatsResponse(
        status="ok" if db_status == "healthy" else "degraded",
        database=db_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
        storage=storage,
        server=server,
        counts=counts,
    )


@router.post("/system/clear")
async def clear_system_data(
    data: ClearDataRequest,
    user: AuthUser = Depends(require_permission(Permission.DEVELOPER_ACCESS)),
    db: AsyncSession = Depends(get_db),
):
    if data.confirm_text != "DELETE ALL DATA":
        raise HTTPException(
            status_code=400,
            detail='Confirmation text must be exactly "DELETE ALL DATA"',
        )

    if not any([data.clear_orders, data.clear_analytics, data.clear_logs, data.clear_customers, data.clear_r2]):
        raise HTTPException(status_code=400, detail="Select at least one item to clear")

    result: dict = {}

    if data.clear_orders:
        result["orders"] = await clear_orders(db)

    if data.clear_analytics:
        result["visit_analytics_deleted"] = await clear_analytics(db)

    if data.clear_logs:
        result["logs"] = await clear_logs(db)

    if data.clear_customers:
        remaining_orders = (await db.execute(select(func.count(Order.id)))).scalar() or 0
        if remaining_orders > 0:
            raise HTTPException(
                status_code=400,
                detail="Clear orders before clearing customers",
            )
        result["customers_deleted"] = await clear_customers(db)

    if data.clear_r2:
        deleted, freed = await purge_storage()
        result["r2"] = {"files_deleted": deleted, "bytes_freed": freed}

    await log_audit(
        db,
        action="system_data_cleared",
        actor_type=user.role,
        actor_id=str(user.id) if user.id else "owner",
        resource_type="system",
        resource_id="clear",
        details=result,
    )

    return {"cleared": True, "details": result}
