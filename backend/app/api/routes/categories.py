import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthUser, require_permission
from app.core.config import get_settings
from app.core.permissions import Permission
from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryAdminResponse, CategoryCreate, CategoryResponse, CategoryUpdate
from app.storage import get_storage_backend
from app.utils.image import compress_image, validate_image
from app.utils.slug import slugify

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.sort_order, Category.name)
    )
    return result.scalars().all()


@router.get("/admin/all", response_model=list[CategoryAdminResponse])
async def list_categories_admin(
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).order_by(Category.sort_order, Category.name))
    return result.scalars().all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    slug = data.slug or slugify(data.name)
    existing = await db.execute(select(Category).where(Category.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    category = Category(
        name=data.name,
        slug=slug,
        description=data.description,
        image_url=data.image_url,
        sort_order=data.sort_order,
        is_active=data.is_active,
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    await db.flush()
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    count_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.category_id == category_id)
    )
    if (count_result.scalar() or 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with assigned products")

    if category.image_url:
        storage = get_storage_backend()
        await storage.delete(category.image_url)

    await db.delete(category)


@router.post("/{category_id}/image")
async def upload_category_image(
    category_id: int,
    file: UploadFile = File(...),
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    data = await file.read()
    valid, msg = validate_image(file.content_type or "", data, settings.max_upload_bytes)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    compressed, content_type = compress_image(data, file.content_type or "image/jpeg")
    storage = get_storage_backend()
    public_url = await storage.save(compressed, f"category-{uuid.uuid4().hex}.jpg", content_type)

    if category.image_url:
        await storage.delete(category.image_url)

    category.image_url = public_url
    await db.flush()
    return {"url": public_url}
