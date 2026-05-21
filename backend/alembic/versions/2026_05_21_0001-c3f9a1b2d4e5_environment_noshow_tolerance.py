"""environment_noshow_tolerance

Revision ID: c3f9a1b2d4e5
Revises: 38b33a399397
Create Date: 2026-05-21 00:01:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3f9a1b2d4e5"
down_revision: str | Sequence[str] | None = "38b33a399397"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "environments",
        sa.Column(
            "noshow_tolerance_min",
            sa.Integer(),
            nullable=False,
            server_default="15",
        ),
    )


def downgrade() -> None:
    op.drop_column("environments", "noshow_tolerance_min")
