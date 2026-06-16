from dataclasses import dataclass
from typing import Optional, Set

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.permissions import Permission, has_permission
from app.core.security import decode_token, verify_password
from app.db.session import get_db
from app.models.admin import Admin

security = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    id: Optional[int]
    username: str
    role: str
    permissions: Set[str]
    telegram_id: Optional[int] = None
    is_owner: bool = False


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AuthUser:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    role = payload.get("role", "")
    if role == "owner":
        settings = get_settings()
        return AuthUser(
            id=None,
            username="owner",
            role="owner",
            permissions=set(),
            telegram_id=settings.OWNER_TELEGRAM_ID or None,
            is_owner=True,
        )

    admin_id = int(payload.get("sub", 0))
    result = await db.execute(select(Admin).where(Admin.id == admin_id, Admin.is_active == True))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")

    return AuthUser(
        id=admin.id,
        username=admin.username,
        role="admin",
        permissions=set(admin.permissions or []),
        telegram_id=admin.telegram_id,
    )


def require_permission(permission: Permission):
    async def checker(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if not has_permission(user.permissions, permission, is_owner=user.is_owner):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return checker


async def authenticate_owner_or_admin(
    username: str, password: str, db: AsyncSession
) -> Optional[AuthUser]:
    settings = get_settings()
    if username == "owner" and settings.OWNER_PASSWORD_HASH:
        if verify_password(password, settings.OWNER_PASSWORD_HASH):
            return AuthUser(
                id=None,
                username="owner",
                role="owner",
                permissions=set(),
                telegram_id=settings.OWNER_TELEGRAM_ID or None,
                is_owner=True,
            )

    result = await db.execute(select(Admin).where(Admin.username == username, Admin.is_active == True))
    admin = result.scalar_one_or_none()
    if admin and verify_password(password, admin.password_hash):
        return AuthUser(
            id=admin.id,
            username=admin.username,
            role="admin",
            permissions=set(admin.permissions or []),
            telegram_id=admin.telegram_id,
        )
    return None


def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("CF-Connecting-IP") or request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None
