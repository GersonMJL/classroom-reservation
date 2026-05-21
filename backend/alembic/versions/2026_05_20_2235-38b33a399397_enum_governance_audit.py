"""enum_governance_audit

Revision ID: 38b33a399397
Revises: seed_demo_data
Create Date: 2026-05-20 22:35:29.322609

"""

from collections.abc import Sequence

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "38b33a399397"
down_revision: str | Sequence[str] | None = "seed_demo_data"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # penalty_type
    op.execute("ALTER TABLE penalties ALTER COLUMN type TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS penalty_type")
    op.execute("""
        CREATE TYPE penalty_type AS ENUM (
            'NO_SHOW', 'LATE_CANCELLATION', 'DAMAGE', 'MISUSE', 'OVERTIME', 'SAFETY_VIOLATION'
        )
    """)
    op.execute(
        "ALTER TABLE penalties ALTER COLUMN type TYPE penalty_type USING type::penalty_type"
    )

    # penalty_status
    op.execute("ALTER TABLE penalties ALTER COLUMN status TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS penalty_status")
    op.execute("""
        CREATE TYPE penalty_status AS ENUM (
            'PENDING', 'APPLIED', 'WAIVED', 'UNDER_APPEAL', 'RESOLVED'
        )
    """)
    op.execute(
        "ALTER TABLE penalties ALTER COLUMN status TYPE penalty_status USING status::penalty_status"
    )

    # appeal_status
    op.execute("ALTER TABLE appeals ALTER COLUMN status TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS appeal_status")
    op.execute("""
        CREATE TYPE appeal_status AS ENUM (
            'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
        )
    """)
    op.execute(
        "ALTER TABLE appeals ALTER COLUMN status TYPE appeal_status USING status::appeal_status"
    )

    # incident_severity
    op.execute("ALTER TABLE incidents ALTER COLUMN severity TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS incident_severity")
    op.execute("""
        CREATE TYPE incident_severity AS ENUM (
            'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        )
    """)
    op.execute(
        "ALTER TABLE incidents ALTER COLUMN severity TYPE incident_severity USING severity::incident_severity"
    )

    # audit_action
    op.execute("ALTER TABLE audit_records ALTER COLUMN action TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS audit_action")
    op.execute("""
        CREATE TYPE audit_action AS ENUM (
            'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CANCEL',
            'CHECKIN', 'CHECKOUT', 'ASSIGN_RESOURCE', 'REMOVE_RESOURCE'
        )
    """)
    op.execute(
        "ALTER TABLE audit_records ALTER COLUMN action TYPE audit_action USING action::audit_action"
    )


def downgrade() -> None:
    # audit_action: revert
    op.execute("ALTER TABLE audit_records ALTER COLUMN action TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS audit_action")

    # incident_severity: revert
    op.execute("ALTER TABLE incidents ALTER COLUMN severity TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS incident_severity")

    # appeal_status: revert
    op.execute("ALTER TABLE appeals ALTER COLUMN status TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS appeal_status")

    # penalty_status: revert
    op.execute("ALTER TABLE penalties ALTER COLUMN status TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS penalty_status")

    # penalty_type: revert
    op.execute("ALTER TABLE penalties ALTER COLUMN type TYPE VARCHAR(64)")
    op.execute("DROP TYPE IF EXISTS penalty_type")
