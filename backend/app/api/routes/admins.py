from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthUser, require_permission
from app.core.permissions import ALL_PERMISSIONS, Permission
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminResponse, AdminUpdate

router = APIRouter(prefix="/admins", tags=["admins"])


@router.get("", response_model=list[AdminResponse])
async def list_admins(
    user: AuthUser = Depends(require_permission(Permission.MANAGE_ADMINS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Admin).order_by(Admin.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    data: AdminCreate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_ADMINS)),
    db: AsyncSession = Depends(get_db),
):
    invalid = set(data.permissions) - ALL_PERMISSIONS
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")

    existing = await db.execute(select(Admin).where(Admin.username == data.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")

    admin = Admin(
        username=data.username,
        password_hash=get_password_hash(data.password),
        telegram_id=data.telegram_id,
        permissions=data.permissions,
    )
    db.add(admin)
    await db.flush()
    await db.refresh(admin)
    return admin


@router.patch("/{admin_id}", response_model=AdminResponse)
async def update_admin(
    admin_id: int,
    data: AdminUpdate,
    user: AuthUser = Depends(require_permission(Permission.MANAGE_ADMINS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        admin.password_hash = get_password_hash(update_data.pop("password"))
    if "permissions" in update_data:
        invalid = set(update_data["permissions"]) - ALL_PERMISSIONS
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")
    for key, value in update_data.items():
        setattr(admin, key, value)

    await db.flush()
    return admin
