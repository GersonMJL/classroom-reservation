"""reservation_purpose_enum

Revision ID: 58d0521d2147
Revises: d5f6a7b8c9e0
Create Date: 2026-05-30 14:12:08.940204

"""
from collections.abc import Sequence

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '58d0521d2147'
down_revision: str | Sequence[str] | None = 'd5f6a7b8c9e0'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Ensure the column is plain VARCHAR so we can rewrite values freely.
    op.execute("ALTER TABLE reservations ALTER COLUMN purpose TYPE VARCHAR(128)")

    # Backfill: any legacy free-text purpose collapses to CLASS (see plan: Migration Default Decision).
    op.execute(
        """
        UPDATE reservations
        SET purpose = 'CLASS'
        WHERE purpose NOT IN (
            'CLASS', 'MEETING', 'RESEARCH', 'EVENT', 'MAINTENANCE', 'TRAINING'
        )
        """
    )

    # Create the enum type and convert the column.
    op.execute("DROP TYPE IF EXISTS reservation_purpose")
    op.execute(
        """
        CREATE TYPE reservation_purpose AS ENUM (
            'CLASS', 'MEETING', 'RESEARCH', 'EVENT', 'MAINTENANCE', 'TRAINING'
        )
        """
    )
    op.execute(
        "ALTER TABLE reservations ALTER COLUMN purpose TYPE reservation_purpose "
        "USING purpose::reservation_purpose"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE reservations ALTER COLUMN purpose TYPE VARCHAR(128)")
    op.execute("DROP TYPE IF EXISTS reservation_purpose")
