from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.organizational_units.models import OrganizationalUnit


class User(Base):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    organizational_unit_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizational_units.id"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organizational_unit: Mapped["OrganizationalUnit"] = relationship("OrganizationalUnit", back_populates="users")
    requested_reservations = relationship(
        "Reservation",
        foreign_keys="Reservation.requester_id",
        back_populates="requester",
    )
    responsible_reservations = relationship(
        "Reservation",
        foreign_keys="Reservation.responsible_id",
        back_populates="responsible",
    )
    qualifications = relationship(
        "UserQualification", back_populates="user", cascade="all, delete-orphan"
    )
    penalties = relationship("Penalty", back_populates="user")
    approvals = relationship("Approval", back_populates="approver")
    assigned_supports = relationship(
        "ReservationSupport", back_populates="assigned_staff"
    )
    reservation_versions = relationship(
        "ReservationVersion", back_populates="changed_by_user"
    )
    audit_logs = relationship("AuditLog", back_populates="performed_by_user")
    user_roles = relationship(
        "UserRole", back_populates="user", cascade="all, delete-orphan"
    )


class Role(Base):
    __tablename__ = "roles"

    role_id: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )

    user_roles = relationship(
        "UserRole", back_populates="role", cascade="all, delete-orphan"
    )


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_role"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")
