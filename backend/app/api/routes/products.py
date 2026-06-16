import math
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import AuthUser, require_permission
from app.core.config import get_settings
from app.core.permissions import Permission
from app.db.session import get_db
from app.models.product import Product, ProductImage, ProductSizeStock
from app.schemas.common import PaginatedResponse
from app.schemas.product import AdminProductListItem, ProductCreate, ProductDetail, ProductListItem, ProductUpdate
from app.services.notifications import publish_product_to_channel
from app.storage import get_storage_backend
from app.utils.format import format_price
from app.utils.image import compress_image, validate_image
from app.utils.slug import slugify

router = APIRouter(prefix="/products", tags=["products"])


def _product_to_list_item(product: Product) -> ProductListItem:
    primary = next((img.url for img in product.images if img.is_primary), None)
    if not primary and product.images:
        primary = product.images[0].url
    in_stock = any(s.stock > 0 for s in product.size_stocks) if product.size_stocks else False
    return ProductListItem(
        id=product.id,
        name=product.name,
        slug=product.slug,
        price=product.price,
        compare_at_price=product.compare_at_price,
        is_featured=product.is_featured,
        is_new_arrival=product.is_new_arrival,
        is_best_seller=product.is_best_seller,
        category_slug=product.category.slug if product.category else None,
        primary_image=primary,
        in_stock=in_stock,
    )


def _product_to_admin_item(product: Product) -> AdminProductListItem:
    base = _product_to_list_item(product)
    return AdminProductListItem(
        **base.model_dump(),
        description=product.description,
        category_id=product.category_id,
        is_active=product.is_active,
        size_stocks=product.size_stocks,
    )


def _product_to_detail(product: Product) -> ProductDetail:
    in_stock = any(s.stock > 0 for s in product.size_stocks) if product.size_stocks else False
    return ProductDetail(
        id=product.id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        price=product.price,
        compare_at_price=product.compare_at_price,
        is_featured=product.is_featured,
        is_new_arrival=product.is_new_arrival,
        is_best_seller=product.is_best_seller,
        category_id=product.category_id,
        category_slug=product.category.slug if product.category else None,
        category_name=product.category.name if product.category else None,
        images=product.images,
        size_stocks=product.size_stocks,
        in_stock=in_stock,
        view_count=product.view_count,
        created_at=product.created_at,
    )


@router.get("", response_model=PaginatedResponse[ProductListItem])
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=48),
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    size: Optional[str] = None,
    in_stock: Optional[bool] = None,
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    best_seller: Optional[bool] = None,
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc|popular)$"),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Product)
        .options(selectinload(Product.images), selectinload(Product.size_stocks), selectinload(Product.category))
        .where(Product.is_active == True)
    )

    if search:
        query = query.where(or_(Product.name.ilike(f"%{search}%"), Product.description.ilike(f"%{search}%")))
    if category:
        from app.models.category import Category
        query = query.join(Category).where(Category.slug == category)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    if featured:
        query = query.where(Product.is_featured == True)
    if new_arrival:
        query = query.where(Product.is_new_arrival == True)
    if best_seller:
        query = query.where(Product.is_best_seller == True)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "popular":
        query = query.order_by(Product.view_count.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    products = result.scalars().unique().all()

    items = []
    for p in products:
        item = _product_to_list_item(p)
        if in_stock is not None and item.in_stock != in_stock:
            continue
        if size and not any(s.size == size and s.stock > 0 for s in p.size_stocks):
            continue
        items.append(item)

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/admin/list", response_model=PaginatedResponse[AdminProductListItem])
async def list_products_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    include_inactive: bool = True,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Product)
        .options(selectinload(Product.images), selectinload(Product.size_stocks), selectinload(Product.category))
        .order_by(Product.created_at.desc())
    )
    if not include_inactive:
        query = query.where(Product.is_active == True)
    if search:
        query = query.where(or_(Product.name.ilike(f"%{search}%"), Product.description.ilike(f"%{search}%")))
    if category_id:
        query = query.where(Product.category_id == category_id)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    products = result.scalars().unique().all()

    return PaginatedResponse(
        items=[_product_to_admin_item(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/admin/{product_id}", response_model=ProductDetail)
async def get_product_admin(
    product_id: int,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.images), selectinload(Product.size_stocks), selectinload(Product.category))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_to_detail(product)


@router.get("/{slug}", response_model=ProductDetail)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.images), selectinload(Product.size_stocks), selectinload(Product.category))
        .where(Product.slug == slug, Product.is_active == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.view_count += 1
    return _product_to_detail(product)


@router.post("", response_model=ProductDetail, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    slug = data.slug or slugify(data.name)
    existing = await db.execute(select(Product).where(Product.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{int(__import__('time').time())}"

    product = Product(
        name=data.name,
        slug=slug,
        description=data.description,
        price=data.price,
        compare_at_price=data.compare_at_price,
        category_id=data.category_id,
        is_featured=data.is_featured,
        is_new_arrival=data.is_new_arrival,
        is_best_seller=data.is_best_seller,
        is_active=data.is_active,
    )
    for ss in data.size_stocks:
        product.size_stocks.append(ProductSizeStock(size=ss.size, stock=ss.stock))
    db.add(product)
    await db.flush()
    await db.refresh(product, ["images", "size_stocks", "category"])
    return _product_to_detail(product)


@router.patch("/{product_id}", response_model=ProductDetail)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.images), selectinload(Product.size_stocks), selectinload(Product.category))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    size_stocks = update_data.pop("size_stocks", None)
    for key, value in update_data.items():
        setattr(product, key, value)

    if size_stocks is not None:
        product.size_stocks.clear()
        for ss in size_stocks:
            product.size_stocks.append(ProductSizeStock(size=ss["size"], stock=ss["stock"]))

    await db.flush()
    return _product_to_detail(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).options(selectinload(Product.images)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    storage = get_storage_backend()
    for image in product.images:
        await storage.delete(image.url)

    await db.delete(product)


@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    result = await db.execute(
        select(Product).options(selectinload(Product.images)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    data = await file.read()
    valid, msg = validate_image(file.content_type or "", data, settings.max_upload_bytes)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    compressed, content_type = compress_image(data, file.content_type or "image/jpeg")
    storage = get_storage_backend()
    url = await storage.save(compressed, file.filename or "image.jpg", content_type)

    if is_primary:
        for img in product.images:
            img.is_primary = False

    image = ProductImage(
        product_id=product_id,
        url=url,
        alt_text=product.name,
        sort_order=len(product.images),
        is_primary=is_primary or len(product.images) == 0,
    )
    db.add(image)
    await db.flush()
    return {"url": url, "id": image.id}


@router.post("/{product_id}/publish-channel")
async def publish_to_channel(
    product_id: int,
    user: AuthUser = Depends(require_permission(Permission.PUBLISH_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    result = await db.execute(
        select(Product).options(selectinload(Product.images)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    images = sorted(product.images, key=lambda img: (not img.is_primary, img.sort_order))
    image_urls = [img.url for img in images if img.url]

    product_url = f"{settings.FRONTEND_URL}/product/{product.slug}"
    success, detail = await publish_product_to_channel(
        product.name,
        format_price(product.price),
        image_urls,
        product_url,
    )
    if success:
        product.is_published_to_channel = True
    return {"published": success, "detail": detail or None}
