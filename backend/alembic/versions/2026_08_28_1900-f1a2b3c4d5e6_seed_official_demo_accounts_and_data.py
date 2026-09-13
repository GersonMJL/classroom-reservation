"""seed official demo accounts and rich contextual data

Revision ID: f1a2b3c4d5e6
Revises: e7a8b9c0d1e2
Create Date: 2026-08-28 19:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from argon2 import PasswordHasher

revision: str = "f1a2b3c4d5e6"
down_revision: str | Sequence[str] | None = "e7a8b9c0d1e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_ROLES = [
    ("ADMIN", "Administrador Geral"),
    ("MANAGER", "Gestor de Ambientes"),
    ("PROFESSOR", "Professor"),
    ("STUDENT", "Aluno / Usuário Comum"),
    ("TECHNICIAN", "Técnico de Suporte"),
    ("REQUESTER", "Solicitante"),
]

_USERS = [
    {
        "name": "Administrador do Sistema",
        "email": "admin@reservas.com",
        "password": "admin123",
        "roles": ["ADMIN", "MANAGER"],
    },
    {
        "name": "Prof. Dra. Camila Santos",
        "email": "professor@reservas.com",
        "password": "prof123",
        "roles": ["PROFESSOR", "REQUESTER"],
    },
    {
        "name": "Lucas Oliveira (Aluno)",
        "email": "aluno@reservas.com",
        "password": "aluno123",
        "roles": ["STUDENT"],
    },
    {
        "name": "Marcos Técnico",
        "email": "tecnico@reservas.com",
        "password": "tec123",
        "roles": ["TECHNICIAN"],
    },
]

_SAMPLE_ENVIRONMENTS = [
    {
        "code": "LAB-INF-01",
        "name": "Laboratório de Informática Avançada 1",
        "type": "LABORATORY",
        "criticality": "CONTROLLED",
        "capacity": 35,
        "campus": "Campus Centro",
        "building": "Bloco A",
        "floor": "2",
        "op_hours": "07:30-22:30",
        "requires_approval": True,
        "buffer_before": 15,
        "buffer_after": 15,
        "noshow_tolerance": 15,
    },
    {
        "code": "AUD-NOBRE",
        "name": "Auditório Nobre Universitário",
        "type": "AUDITORIUM",
        "criticality": "RESTRICTED",
        "capacity": 250,
        "campus": "Campus Centro",
        "building": "Bloco A",
        "floor": "1",
        "op_hours": "08:00-22:00",
        "requires_approval": True,
        "buffer_before": 30,
        "buffer_after": 30,
        "noshow_tolerance": 20,
    },
    {
        "code": "SALA-EST-01",
        "name": "Sala de Estudos em Grupo 101",
        "type": "CLASSROOM",
        "criticality": "COMMON",
        "capacity": 20,
        "campus": "Campus Centro",
        "building": "Bloco A",
        "floor": "1",
        "op_hours": "08:00-22:00",
        "requires_approval": False,
        "buffer_before": 0,
        "buffer_after": 0,
        "noshow_tolerance": 15,
    },
]


def upgrade() -> None:
    conn = op.get_bind()
    hasher = PasswordHasher()

    # 1. Insert or update roles
    for code, name in _ROLES:
        conn.execute(
            sa.text("""
                INSERT INTO roles (code, name)
                VALUES (:code, :name)
                ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            """),
            {"code": code, "name": name},
        )

    # 2. Insert or update demo users with fresh argon2 hash
    for u in _USERS:
        pwd_hash = hasher.hash(u["password"])
        conn.execute(
            sa.text("""
                INSERT INTO users (name, email, password_hash, active)
                VALUES (:name, :email, :password_hash, true)
                ON CONFLICT (email) DO UPDATE
                SET password_hash = EXCLUDED.password_hash,
                    name = EXCLUDED.name,
                    active = true
            """),
            {"name": u["name"], "email": u["email"], "password_hash": pwd_hash},
        )

        for role_code in u["roles"]:
            conn.execute(
                sa.text("""
                    INSERT INTO user_roles (user_id, role_id)
                    SELECT u.id, r.id FROM users u, roles r
                    WHERE u.email = :email AND r.code = :code
                    ON CONFLICT ON CONSTRAINT uq_user_role DO NOTHING
                """),
                {"email": u["email"], "code": role_code},
            )

    # 3. Add rich environments if not already present
    for env in _SAMPLE_ENVIRONMENTS:
        conn.execute(
            sa.text("""
                INSERT INTO locations (campus, building, floor)
                SELECT :campus, :building, :floor WHERE NOT EXISTS (
                    SELECT 1 FROM locations
                    WHERE campus = :campus AND building = :building AND floor = :floor
                )
            """),
            {"campus": env["campus"], "building": env["building"], "floor": env["floor"]},
        )

        conn.execute(
            sa.text("""
                INSERT INTO environments (
                    code, name, type, criticality, capacity, location_id,
                    operating_hours, requires_approval, buffer_before_min,
                    buffer_after_min, noshow_tolerance_min, active
                )
                SELECT :code, :name, :type, :criticality, :capacity, l.id,
                       :op_hours, :requires_approval, :buffer_before,
                       :buffer_after, :noshow_tolerance, true
                FROM locations l
                WHERE l.campus = :campus AND l.building = :building AND l.floor = :floor
                AND NOT EXISTS (SELECT 1 FROM environments WHERE name = :name OR (code IS NOT NULL AND code = :code))
            """),
            {
                "code": env["code"],
                "name": env["name"],
                "type": env["type"],
                "criticality": env["criticality"],
                "capacity": env["capacity"],
                "op_hours": env["op_hours"],
                "requires_approval": env["requires_approval"],
                "buffer_before": env["buffer_before"],
                "buffer_after": env["buffer_after"],
                "noshow_tolerance": env["noshow_tolerance"],
                "campus": env["campus"],
                "building": env["building"],
                "floor": env["floor"],
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    user_emails = [u["email"] for u in _USERS]
    conn.execute(
        sa.text("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = ANY(:emails))"),
        {"emails": user_emails},
    )
    conn.execute(
        sa.text("DELETE FROM users WHERE email = ANY(:emails)"),
        {"emails": user_emails},
    )
