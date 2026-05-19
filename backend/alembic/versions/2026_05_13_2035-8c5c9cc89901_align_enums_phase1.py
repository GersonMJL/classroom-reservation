"""align_enums_phase1

Revision ID: 8c5c9cc89901
Revises: seed_admin_user
Create Date: 2026-05-13 20:35:23.341584

"""

from collections.abc import Sequence

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "8c5c9cc89901"
down_revision: str | Sequence[str] | None = "seed_admin_user"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # reservation_status: remove AWAITING_CHECKIN, AWAITING_CHECKOUT; add PRE_BLOCKED, EXPIRED
    op.execute("ALTER TABLE reservations ALTER COLUMN status TYPE VARCHAR(64)")
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN previous_status TYPE VARCHAR(64)"
    )
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN new_status TYPE VARCHAR(64)"
    )
    op.execute("DROP TYPE IF EXISTS reservation_status")
    op.execute("""
        CREATE TYPE reservation_status AS ENUM (
            'DRAFT', 'PENDING_APPROVAL', 'PRE_BLOCKED', 'APPROVED', 'REJECTED',
            'CANCELLED', 'IN_USE', 'COMPLETED', 'NO_SHOW', 'EXPIRED'
        )
    """)
    op.execute(
        "ALTER TABLE reservations ALTER COLUMN status TYPE reservation_status USING status::reservation_status"
    )
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN previous_status TYPE reservation_status USING previous_status::reservation_status"
    )
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN new_status TYPE reservation_status USING new_status::reservation_status"
    )

    # reservation_type: COMPOSITE → COMPOSITE_PARENT, COMPOSITE_CHILD
    op.execute("ALTER TABLE reservations ALTER COLUMN type TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS reservation_type")
    op.execute(
        "CREATE TYPE reservation_type AS ENUM ('SIMPLE', 'RECURRING', 'COMPOSITE_PARENT', 'COMPOSITE_CHILD')"
    )
    op.execute(
        "ALTER TABLE reservations ALTER COLUMN type TYPE reservation_type USING type::reservation_type"
    )

    # approval_status: add REQUIRES_CHANGES, ESCALATED (additive only)
    op.execute("ALTER TYPE approval_status ADD VALUE IF NOT EXISTS 'REQUIRES_CHANGES'")
    op.execute("ALTER TYPE approval_status ADD VALUE IF NOT EXISTS 'ESCALATED'")

    # calendar_block_type: rename EVENT→RECURRING_EVENT; add BUFFER, CLOSURE
    op.execute("ALTER TABLE calendar_blocks ALTER COLUMN type TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS calendar_block_type")
    op.execute("""
        CREATE TYPE calendar_block_type AS ENUM (
            'ADMIN_BLOCK', 'MAINTENANCE', 'RECURRING_EVENT', 'BUFFER', 'HOLIDAY', 'CLOSURE'
        )
    """)
    op.execute(
        "UPDATE calendar_blocks SET type = 'RECURRING_EVENT' WHERE type = 'EVENT'"
    )
    op.execute(
        "ALTER TABLE calendar_blocks ALTER COLUMN type TYPE calendar_block_type USING type::calendar_block_type"
    )

    # support_type: column was never renamed from tipo_suporte in english migration
    # Fix: convert type, rename column, and update enum values
    op.execute(
        "ALTER TABLE reservation_support ALTER COLUMN tipo_suporte TYPE VARCHAR(64)"
    )
    op.execute("DROP TYPE IF EXISTS support_type")
    op.execute("""
        CREATE TYPE support_type AS ENUM (
            'IT_SUPPORT', 'AUDIOVISUAL', 'LAB_TECHNICIAN', 'SECURITY', 'CLEANING'
        )
    """)
    op.execute(
        "UPDATE reservation_support SET tipo_suporte = 'IT_SUPPORT' WHERE tipo_suporte = 'TECHNICAL'"
    )
    op.execute(
        "ALTER TABLE reservation_support ALTER COLUMN tipo_suporte TYPE support_type USING tipo_suporte::support_type"
    )
    op.alter_column("reservation_support", "tipo_suporte", new_column_name="support_type")


def downgrade() -> None:
    # support_type: revert column rename and enum values
    op.alter_column("reservation_support", "support_type", new_column_name="tipo_suporte")
    op.execute(
        "ALTER TABLE reservation_support ALTER COLUMN tipo_suporte TYPE VARCHAR(64)"
    )
    op.execute("DROP TYPE IF EXISTS support_type")
    op.execute("CREATE TYPE support_type AS ENUM ('TECHNICAL', 'CLEANING', 'SECURITY')")
    op.execute(
        "UPDATE reservation_support SET tipo_suporte = 'TECHNICAL' WHERE tipo_suporte IN ('IT_SUPPORT', 'AUDIOVISUAL', 'LAB_TECHNICIAN')"
    )
    op.execute(
        "ALTER TABLE reservation_support ALTER COLUMN tipo_suporte TYPE support_type USING tipo_suporte::support_type"
    )

    # calendar_block_type: revert
    op.execute("ALTER TABLE calendar_blocks ALTER COLUMN type TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS calendar_block_type")
    op.execute(
        "CREATE TYPE calendar_block_type AS ENUM ('MAINTENANCE', 'HOLIDAY', 'EVENT', 'ADMIN_BLOCK')"
    )
    op.execute(
        "UPDATE calendar_blocks SET type = 'EVENT' WHERE type = 'RECURRING_EVENT'"
    )
    op.execute(
        "ALTER TABLE calendar_blocks ALTER COLUMN type TYPE calendar_block_type USING type::calendar_block_type"
    )

    # approval_status: cannot remove values from enum in PostgreSQL — downgrade is destructive
    # Columns using REQUIRES_CHANGES or ESCALATED would need to be cleared first

    # reservation_type: revert
    op.execute("ALTER TABLE reservations ALTER COLUMN type TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS reservation_type")
    op.execute(
        "CREATE TYPE reservation_type AS ENUM ('SIMPLE', 'RECURRING', 'COMPOSITE')"
    )
    op.execute(
        "ALTER TABLE reservations ALTER COLUMN type TYPE reservation_type USING type::reservation_type"
    )

    # reservation_status: revert
    op.execute("ALTER TABLE reservations ALTER COLUMN status TYPE VARCHAR(64)")
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN previous_status TYPE VARCHAR(64)"
    )
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN new_status TYPE VARCHAR(64)"
    )
    op.execute("DROP TYPE IF EXISTS reservation_status")
    op.execute("""
        CREATE TYPE reservation_status AS ENUM (
            'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED',
            'AWAITING_CHECKIN', 'IN_USE', 'AWAITING_CHECKOUT', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
        )
    """)
    op.execute(
        "ALTER TABLE reservations ALTER COLUMN status TYPE reservation_status USING status::reservation_status"
    )
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN previous_status TYPE reservation_status USING previous_status::reservation_status"
    )
    op.execute(
        "ALTER TABLE reservation_status_history ALTER COLUMN new_status TYPE reservation_status USING new_status::reservation_status"
    )
