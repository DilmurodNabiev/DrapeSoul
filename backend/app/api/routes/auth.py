from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import authenticate_owner_or_admin, get_client_ip, get_current_user, AuthUser
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import AdminLoginRequest, AdminMeResponse, TokenResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/admin", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def admin_login(
    data: AdminLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_owner_or_admin(data.username, data.password, db)
    if not user:
        await log_audit(
            db,
            action="login_failed",
            actor_type="unknown",
            details={"username": data.username},
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(
        subject=user.id or "owner",
        extra={"role": user.role, "username": user.username},
    )
    await log_audit(
        db,
        action="login_success",
        actor_type=user.role,
        actor_id=str(user.id) if user.id else "owner",
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=AdminMeResponse)
async def admin_me(user: AuthUser = Depends(get_current_user)):
    from app.core.permissions import ALL_PERMISSIONS

    return AdminMeResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        permissions=list(ALL_PERMISSIONS) if user.is_owner else list(user.permissions),
        telegram_id=user.telegram_id,
    )
