"""seed essential demo data for reservation flows

Popula dados mínimos para os fluxos existentes funcionarem ponta-a-ponta:
papéis adicionais (manager/technician/requester), usuário solicitante e
técnico, unidades organizacionais, locais, ambientes (mix de criticidade) e
recursos. Idempotente: cada INSERT só ocorre se a linha alvo não existir.

Revision ID: seed_demo_data
Revises: 8c5c9cc89901
Create Date: 2026-05-13 22:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from argon2 import PasswordHasher

revision: str = "seed_demo_data"
down_revision: str | Sequence[str] | None = "8c5c9cc89901"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_ROLES = [
    ("MANAGER", "Gestor"),
    ("TECHNICIAN", "Técnico"),
    ("REQUESTER", "Solicitante"),
]

_USERS = [
    {
        "name": "Professor Exemplo",
        "email": "prof@example.com",
        "password": "prof123",
        "roles": ["REQUESTER"],
    },
    {
        "name": "Gestor Exemplo",
        "email": "gestor@example.com",
        "password": "gestor123",
        "roles": ["MANAGER"],
    },
    {
        "name": "Técnico Exemplo",
        "email": "tecnico@example.com",
        "password": "tecnico123",
        "roles": ["TECHNICIAN"],
    },
]

_ORGANIZATIONAL_UNITS = [
    ("Departamento de Ciência da Computação", "DEPARTMENT"),
    ("Departamento de Matemática", "DEPARTMENT"),
    ("Direção Acadêmica", "ADMINISTRATION"),
]

_LOCATIONS = [
    ("Campus Centro", "Bloco A", "1"),
    ("Campus Centro", "Bloco A", "2"),
    ("Campus Norte", "Bloco B", "Térreo"),
]

# (name, type, criticality, capacity, location, op_hours, requires_approval,
#  buffer_before_min, buffer_after_min)
_ENVIRONMENTS = [
    ("Sala 101", "CLASSROOM", "COMMON", 40, ("Campus Centro", "Bloco A", "1"),
     "08:00-22:00", False, 0, 0),
    ("Sala 102", "CLASSROOM", "COMMON", 40, ("Campus Centro", "Bloco A", "1"),
     "08:00-22:00", False, 0, 0),
    ("Sala de Reunião 1", "MEETING_ROOM", "CONTROLLED", 10,
     ("Campus Centro", "Bloco A", "2"), "08:00-20:00", True, 10, 10),
    ("Auditório Principal", "AUDITORIUM", "CONTROLLED", 200,
     ("Campus Centro", "Bloco A", "1"), "08:00-22:00", True, 30, 30),
    ("Laboratório de Química", "LABORATORY", "RESTRICTED", 20,
     ("Campus Norte", "Bloco B", "Térreo"), "08:00-18:00", True, 15, 15),
]

# (name, type, category, attachment_type)
_RESOURCES = [
    ("Projetor Epson", "EQUIPMENT", "AUDIOVISUAL", "MOBILE"),
    ("Notebook Dell", "EQUIPMENT", "COMPUTING", "MOBILE"),
    ("Caixa de Som Bluetooth", "EQUIPMENT", "AUDIOVISUAL", "MOBILE"),
    ("Chave do Laboratório de Química", "KEY", "ACCESS", "MOBILE"),
    ("Mesa de Reunião Redonda", "FURNITURE", "GENERAL", "FIXED"),
]


def upgrade() -> None:
    conn = op.get_bind()
    hasher = PasswordHasher()

    # Roles
    for code, name in _ROLES:
        conn.execute(
            sa.text(
                "INSERT INTO roles (code, name) VALUES (:code, :name) "
                "ON CONFLICT (code) DO NOTHING"
            ),
            {"code": code, "name": name},
        )

    # Users
    for user in _USERS:
        conn.execute(
            sa.text(
                "INSERT INTO users (name, email, password_hash, active) "
                "VALUES (:name, :email, :password_hash, true) "
                "ON CONFLICT (email) DO NOTHING"
            ),
            {
                "name": user["name"],
                "email": user["email"],
                "password_hash": hasher.hash(user["password"]),
            },
        )
        for role_code in user["roles"]:
            conn.execute(
                sa.text(
                    "INSERT INTO user_roles (user_id, role_id) "
                    "SELECT u.id, r.id FROM users u, roles r "
                    "WHERE u.email = :email AND r.code = :code "
                    "ON CONFLICT ON CONSTRAINT uq_user_role DO NOTHING"
                ),
                {"email": user["email"], "code": role_code},
            )

    # Organizational units
    for name, ou_type in _ORGANIZATIONAL_UNITS:
        conn.execute(
            sa.text(
                "INSERT INTO organizational_units (name, type) "
                "SELECT :name, :type WHERE NOT EXISTS ("
                "  SELECT 1 FROM organizational_units WHERE name = :name"
                ")"
            ),
            {"name": name, "type": ou_type},
        )

    # Locations
    for campus, building, floor in _LOCATIONS:
        conn.execute(
            sa.text(
                "INSERT INTO locations (campus, building, floor) "
                "SELECT :campus, :building, :floor WHERE NOT EXISTS ("
                "  SELECT 1 FROM locations "
                "  WHERE campus = :campus AND building = :building AND floor = :floor"
                ")"
            ),
            {"campus": campus, "building": building, "floor": floor},
        )

    # Environments
    for (
        name,
        env_type,
        criticality,
        capacity,
        (campus, building, floor),
        op_hours,
        requires_approval,
        buffer_before,
        buffer_after,
    ) in _ENVIRONMENTS:
        conn.execute(
            sa.text(
                "INSERT INTO environments ("
                "  name, type, criticality, capacity, location_id, "
                "  operating_hours, requires_approval, buffer_before_min, "
                "  buffer_after_min, active"
                ") SELECT :name, :type, :criticality, :capacity, l.id, "
                "  :op_hours, :requires_approval, :buffer_before, :buffer_after, true "
                "FROM locations l "
                "WHERE l.campus = :campus AND l.building = :building AND l.floor = :floor "
                "AND NOT EXISTS (SELECT 1 FROM environments WHERE name = :name)"
            ),
            {
                "name": name,
                "type": env_type,
                "criticality": criticality,
                "capacity": capacity,
                "op_hours": op_hours,
                "requires_approval": requires_approval,
                "buffer_before": buffer_before,
                "buffer_after": buffer_after,
                "campus": campus,
                "building": building,
                "floor": floor,
            },
        )

    # Resources
    for name, r_type, category, attachment in _RESOURCES:
        conn.execute(
            sa.text(
                "INSERT INTO resources (name, type, category, attachment_type, active) "
                "SELECT :name, :type, :category, :attachment, true "
                "WHERE NOT EXISTS (SELECT 1 FROM resources WHERE name = :name)"
            ),
            {
                "name": name,
                "type": r_type,
                "category": category,
                "attachment": attachment,
            },
        )

    # Fixar a mesa redonda na Sala de Reunião 1
    conn.execute(
        sa.text(
            "UPDATE resources SET environment_id = e.id "
            "FROM environments e "
            "WHERE resources.name = :resource AND e.name = :env "
            "AND resources.environment_id IS NULL"
        ),
        {"resource": "Mesa de Reunião Redonda", "env": "Sala de Reunião 1"},
    )


def downgrade() -> None:
    conn = op.get_bind()

    resource_names = [r[0] for r in _RESOURCES]
    conn.execute(
        sa.text("DELETE FROM resources WHERE name = ANY(:names)"),
        {"names": resource_names},
    )

    environment_names = [e[0] for e in _ENVIRONMENTS]
    conn.execute(
        sa.text("DELETE FROM environments WHERE name = ANY(:names)"),
        {"names": environment_names},
    )

    location_keys = [(c, b, f) for c, b, f in _LOCATIONS]
    for campus, building, floor in location_keys:
        conn.execute(
            sa.text(
                "DELETE FROM locations "
                "WHERE campus = :campus AND building = :building AND floor = :floor"
            ),
            {"campus": campus, "building": building, "floor": floor},
        )

    ou_names = [o[0] for o in _ORGANIZATIONAL_UNITS]
    conn.execute(
        sa.text("DELETE FROM organizational_units WHERE name = ANY(:names)"),
        {"names": ou_names},
    )

    user_emails = [u["email"] for u in _USERS]
    conn.execute(
        sa.text(
            "DELETE FROM user_roles WHERE user_id IN ("
            "  SELECT id FROM users WHERE email = ANY(:emails)"
            ")"
        ),
        {"emails": user_emails},
    )
    conn.execute(
        sa.text("DELETE FROM users WHERE email = ANY(:emails)"),
        {"emails": user_emails},
    )

    role_codes = [r[0] for r in _ROLES]
    conn.execute(
        sa.text("DELETE FROM roles WHERE code = ANY(:codes)"),
        {"codes": role_codes},
    )
