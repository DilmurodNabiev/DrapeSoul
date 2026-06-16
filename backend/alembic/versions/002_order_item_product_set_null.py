"""Order items keep history when product is deleted

Revision ID: 002
Revises: 001
Create Date: 2026-06-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("order_items", "product_id", existing_type=sa.Integer(), nullable=True)
    op.drop_constraint("order_items_product_id_fkey", "order_items", type_="foreignkey")
    op.create_foreign_key(
        "order_items_product_id_fkey",
        "order_items",
        "products",
        ["product_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("order_items_product_id_fkey", "order_items", type_="foreignkey")
    op.create_foreign_key(
        "order_items_product_id_fkey",
        "order_items",
        "products",
        ["product_id"],
        ["id"],
    )
    op.alter_column("order_items", "product_id", existing_type=sa.Integer(), nullable=False)
