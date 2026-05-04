"""seed admin user

Revision ID: seed_admin_user
Revises: be9c17d27f3d
Create Date: 2026-05-04 00:01:00.000000

"""
from collections.abc import Sequence

from argon2 import PasswordHasher
from alembic import op
import sqlalchemy as sa

revision: str = 'seed_admin_user'
down_revision: str | Sequence[str] | None = 'be9c17d27f3d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_ADMIN_EMAIL = "admin@admin.com"
_ADMIN_PASSWORD = "admin"
_ADMIN_ROLE_CODE = "ADMIN"


def upgrade() -> None:
    conn = op.get_bind()

    password_hash = PasswordHasher().hash(_ADMIN_PASSWORD)

    # Insert ADMIN role if absent
    conn.execute(sa.text("""
        INSERT INTO roles (code, name)
        VALUES (:code, :name)
        ON CONFLICT (code) DO NOTHING
    """), {"code": _ADMIN_ROLE_CODE, "name": "Administrador"})

    # Insert admin user if absent
    conn.execute(sa.text("""
        INSERT INTO users (name, email, password_hash, active)
        VALUES (:name, :email, :password_hash, true)
        ON CONFLICT (email) DO NOTHING
    """), {"name": "Admin", "email": _ADMIN_EMAIL, "password_hash": password_hash})

    # Link user → role
    conn.execute(sa.text("""
        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, r.id
        FROM users u, roles r
        WHERE u.email = :email AND r.code = :code
        ON CONFLICT ON CONSTRAINT uq_user_role DO NOTHING
    """), {"email": _ADMIN_EMAIL, "code": _ADMIN_ROLE_CODE})


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text("""
        DELETE FROM user_roles
        WHERE user_id = (SELECT id FROM users WHERE email = :email)
    """), {"email": _ADMIN_EMAIL})

    conn.execute(sa.text(
        "DELETE FROM users WHERE email = :email"
    ), {"email": _ADMIN_EMAIL})

    conn.execute(sa.text(
        "DELETE FROM roles WHERE code = :code"
    ), {"code": _ADMIN_ROLE_CODE})
