import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthUser, require_permission
from app.core.config import get_settings
from app.core.permissions import Permission
from app.db.session import get_db
from app.models.poster import Poster
from app.schemas.poster import PosterAdminResponse, PosterCreate, PosterResponse, PosterUpdate
from app.storage import get_storage_backend
from app.utils.image import compress_image, validate_image

router = APIRouter(prefix="/posters", tags=["posters"])


@router.get("", response_model=list[PosterResponse])
async def list_posters(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Poster).where(Poster.is_active == True).order_by(Poster.sort_order, Poster.id)
    )
    return result.scalars().all()


@router.get("/admin/all", response_model=list[PosterAdminResponse])
async def list_posters_admin(
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Poster).order_by(Poster.sort_order, Poster.id))
    return result.scalars().all()


@router.post("", response_model=PosterAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_poster(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    link_url: str | None = Form(None),
    sort_order: int = Form(0),
    is_active: bool = Form(True),
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    data = await file.read()
    valid, msg = validate_image(file.content_type or "", data, settings.max_upload_bytes)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    compressed, content_type = compress_image(data, file.content_type or "image/jpeg")
    storage = get_storage_backend()
    public_url = await storage.save(compressed, f"poster-{uuid.uuid4().hex}.jpg", content_type)

    poster = Poster(
        title=title or None,
        image_url=public_url,
        link_url=link_url or None,
        sort_order=sort_order,
        is_active=is_active,
    )
    db.add(poster)
    await db.flush()
    await db.refresh(poster)
    return poster


@router.patch("/{poster_id}", response_model=PosterAdminResponse)
async def update_poster(
    poster_id: int,
    data: PosterUpdate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Poster).where(Poster.id == poster_id))
    poster = result.scalar_one_or_none()
    if not poster:
        raise HTTPException(status_code=404, detail="Poster not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(poster, key, value)
    await db.flush()
    return poster


@router.delete("/{poster_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_poster(
    poster_id: int,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Poster).where(Poster.id == poster_id))
    poster = result.scalar_one_or_none()
    if not poster:
        raise HTTPException(status_code=404, detail="Poster not found")

    if poster.image_url:
        storage = get_storage_backend()
        await storage.delete(poster.image_url)

    await db.delete(poster)


@router.post("/{poster_id}/image")
async def upload_poster_image(
    poster_id: int,
    file: UploadFile = File(...),
    user: AuthUser = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    result = await db.execute(select(Poster).where(Poster.id == poster_id))
    poster = result.scalar_one_or_none()
    if not poster:
        raise HTTPException(status_code=404, detail="Poster not found")

    data = await file.read()
    valid, msg = validate_image(file.content_type or "", data, settings.max_upload_bytes)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    compressed, content_type = compress_image(data, file.content_type or "image/jpeg")
    storage = get_storage_backend()
    public_url = await storage.save(compressed, f"poster-{uuid.uuid4().hex}.jpg", content_type)

    if poster.image_url:
        await storage.delete(poster.image_url)

    poster.image_url = public_url
    await db.flush()
    return {"url": public_url}
