from enum import Enum
from typing import Set


class Permission(str, Enum):
    MANAGE_PRODUCTS = "manage_products"
    MANAGE_ORDERS = "manage_orders"
    PUBLISH_PRODUCTS = "publish_products"
    VIEW_STATISTICS = "view_statistics"
    VIEW_LOGS = "view_logs"
    MANAGE_ADMINS = "manage_admins"
    DEVELOPER_ACCESS = "developer_access"


ALL_PERMISSIONS: Set[str] = {p.value for p in Permission}

DEFAULT_ADMIN_PERMISSIONS: Set[str] = {
    Permission.MANAGE_PRODUCTS.value,
    Permission.MANAGE_ORDERS.value,
    Permission.PUBLISH_PRODUCTS.value,
    Permission.VIEW_STATISTICS.value,
}


def has_permission(user_permissions: Set[str], required: Permission, is_owner: bool = False) -> bool:
    if is_owner:
        return True
    return required.value in user_permissions
