"""reservation_terms_accepted

Revision ID: d5f6a7b8c9e0
Revises: c3f9a1b2d4e5
Create Date: 2026-05-21 00:02:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d5f6a7b8c9e0"
down_revision: str | Sequence[str] | None = "c3f9a1b2d4e5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "reservations",
        sa.Column(
            "terms_accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("reservations", "terms_accepted_at")
