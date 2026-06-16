import json
import math
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import AuthUser, get_client_ip, require_permission
from app.core.config import get_settings
from app.core.permissions import Permission
from app.db.session import get_db
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, ProductSizeStock
from app.schemas.common import PaginatedResponse
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.audit import log_audit
from app.services.notifications import notify_new_order, notify_order_status
from app.services.storage_stats import delete_file_url
from app.services.telegram_verify import verify_telegram_init_data
from app.storage import get_storage_backend
from app.utils.format import format_price
from app.utils.image import compress_image, validate_image

router = APIRouter(prefix="/orders", tags=["orders"])


def _generate_order_number() -> str:
    return f"DS-{uuid.uuid4().hex[:8].upper()}"


async def _save_receipt(file: UploadFile) -> str:
    settings = get_settings()
    data = await file.read()
    valid, msg = validate_image(file.content_type or "", data, settings.max_upload_bytes)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    compressed, content_type = compress_image(data, file.content_type or "image/jpeg")
    storage = get_storage_backend()
    return await storage.save(compressed, f"receipt-{uuid.uuid4().hex}.jpg", content_type)


async def _build_order(
    data: OrderCreate,
    request: Request,
    db: AsyncSession,
    receipt_url: str | None = None,
) -> Order:
    if data.payment_method not in ("contact", "transfer"):
        raise HTTPException(status_code=400, detail="payment_method must be 'contact' or 'transfer'")
    if data.payment_method == "transfer" and not receipt_url:
        raise HTTPException(status_code=400, detail="Payment receipt is required for bank transfer")

    customer = None
    if data.telegram_init_data:
        tg_user = verify_telegram_init_data(data.telegram_init_data)
        if tg_user and tg_user.get("telegram_id"):
            result = await db.execute(
                select(Customer).where(Customer.telegram_id == tg_user["telegram_id"])
            )
            customer = result.scalar_one_or_none()
            if not customer:
                customer = Customer(
                    telegram_id=tg_user["telegram_id"],
                    telegram_username=tg_user.get("username"),
                    first_name=tg_user.get("first_name"),
                    last_name=tg_user.get("last_name"),
                )
                db.add(customer)
                await db.flush()
            elif not data.telegram_username and tg_user.get("username"):
                customer.telegram_username = tg_user["username"]

    total = Decimal("0")
    order_items = []

    for item in data.items:
        result = await db.execute(
            select(Product)
            .options(selectinload(Product.size_stocks))
            .where(Product.id == item.product_id, Product.is_active == True)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")

        size_stock = next((s for s in product.size_stocks if s.size == item.size), None)
        if not size_stock or size_stock.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name} size {item.size}",
            )

        subtotal = product.price * item.quantity
        total += subtotal
        size_stock.stock -= item.quantity
        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                size=item.size,
                quantity=item.quantity,
                unit_price=product.price,
                subtotal=subtotal,
            )
        )

    order = Order(
        order_number=_generate_order_number(),
        customer_id=customer.id if customer else None,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_address=data.customer_address,
        telegram_username=data.telegram_username or (customer.telegram_username if customer else None),
        comment=data.comment,
        delivery_method=data.delivery_method,
        payment_method=data.payment_method,
        payment_receipt_url=receipt_url,
        status=OrderStatus.PENDING.value,
        total_amount=total,
        items=order_items,
    )
    db.add(order)
    await db.flush()
    await db.refresh(order, ["items"])

    settings = get_settings()
    from app.models.admin import Admin

    admin_result = await db.execute(
        select(Admin.telegram_id).where(Admin.is_active == True, Admin.telegram_id.isnot(None))
    )
    admin_ids = [row[0] for row in admin_result.all() if row[0]]

    receiver_id = settings.ORDER_RECEIVER_TELEGRAM_ID or settings.OWNER_TELEGRAM_ID or None

    await notify_new_order(
        order.order_number,
        order.customer_name,
        format_price(order.total_amount),
        admin_ids,
        receiver_id,
        payment_method=order.payment_method,
        receipt_url=order.payment_receipt_url,
    )

    await log_audit(
        db,
        action="order_created",
        actor_type="customer",
        actor_id=str(customer.id) if customer else None,
        resource_type="order",
        resource_id=str(order.id),
        ip_address=get_client_ip(request),
    )

    return order


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    receipt_url = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        order_raw = form.get("order")
        if not order_raw:
            raise HTTPException(status_code=400, detail="Missing order data")
        data = OrderCreate(**json.loads(order_raw if isinstance(order_raw, str) else order_raw))
        receipt = form.get("receipt")
        if receipt and hasattr(receipt, "read"):
            receipt_url = await _save_receipt(receipt)
    else:
        body = await request.json()
        data = OrderCreate(**body)

    if not data.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    return await _build_order(data, request, db, receipt_url)


@router.get("", response_model=PaginatedResponse[OrderResponse])
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    status_filter: str | None = Query(None, alias="status"),
    payment_method: str | None = None,
    search: str | None = None,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_ORDERS)),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    if status_filter:
        query = query.where(Order.status == status_filter)
    if payment_method:
        query = query.where(Order.payment_method == payment_method)
    if search:
        term = search.strip()
        if term.isdigit():
            query = query.where(or_(Order.id == int(term), Order.order_number.ilike(f"%{term}%")))
        else:
            query = query.where(
                or_(
                    Order.order_number.ilike(f"%{term}%"),
                    Order.customer_name.ilike(f"%{term}%"),
                    Order.customer_phone.ilike(f"%{term}%"),
                )
            )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    orders = result.scalars().unique().all()

    return PaginatedResponse(
        items=orders,
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_ORDERS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_ORDERS)),
    db: AsyncSession = Depends(get_db),
):
    valid_statuses = {s.value for s in OrderStatus}
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {valid_statuses}")

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.customer))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    order.status = data.status
    await db.flush()

    if order.customer and order.customer.telegram_id:
        await notify_order_status(order.customer.telegram_id, order.order_number, data.status)

    await log_audit(
        db,
        action="order_status_updated",
        actor_type=user.role,
        actor_id=str(user.id) if user.id else "owner",
        resource_type="order",
        resource_id=str(order.id),
        details={"old_status": old_status, "new_status": data.status},
    )

    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_ORDERS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    receipt_url = order.payment_receipt_url
    order_number = order.order_number
    await db.delete(order)
    await db.flush()

    if receipt_url:
        await delete_file_url(receipt_url)

    await log_audit(
        db,
        action="order_deleted",
        actor_type=user.role,
        actor_id=str(user.id) if user.id else "owner",
        resource_type="order",
        resource_id=str(order_id),
        details={"order_number": order_number, "receipt_deleted": bool(receipt_url)},
    )
