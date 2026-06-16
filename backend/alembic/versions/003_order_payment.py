"""Add payment fields to orders

Revision ID: 003
Revises: 002
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("payment_method", sa.String(length=30), nullable=False, server_default="contact"))
    op.add_column("orders", sa.Column("payment_receipt_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "payment_receipt_url")
    op.drop_column("orders", "payment_method")
