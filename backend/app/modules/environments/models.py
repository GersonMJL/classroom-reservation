from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Environment(Base):
    __tablename__ = "environments"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    criticality: Mapped[str] = mapped_column(String(64), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"), nullable=False
    )
    operating_hours: Mapped[str] = mapped_column(String(255), nullable=False)
    requires_approval: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    buffer_before_min: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default="0"
    )
    buffer_after_min: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default="0"
    )
    noshow_tolerance_min: Mapped[int] = mapped_column(
        Integer, default=15, nullable=False, server_default="15"
    )
    active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, server_default="true"
    )

    location = relationship("Location", back_populates="environments")
    policies = relationship(
        "ReservationPolicy", back_populates="environment", cascade="all, delete-orphan"
    )
    restrictions = relationship(
        "EnvironmentRestriction", back_populates="environment", cascade="all, delete-orphan"
    )
    resources = relationship("Resource", back_populates="environment")
    requirements = relationship(
        "EnvironmentRequirement", back_populates="environment", cascade="all, delete-orphan"
    )
    reservations = relationship("Reservation", back_populates="environment")
    calendar_blocks = relationship(
        "CalendarBlock", back_populates="environment", cascade="all, delete-orphan"
    )
    maintenances = relationship(
        "EnvironmentMaintenance", back_populates="environment", cascade="all, delete-orphan"
    )


class ReservationPolicy(Base):
    __tablename__ = "reservation_policies"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    min_lead_time_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    max_lead_time_days: Mapped[int] = mapped_column(Integer, nullable=False)

    environment = relationship("Environment", back_populates="policies")
    role = relationship("Role")


class EnvironmentRestriction(Base):
    __tablename__ = "environment_restrictions"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    environment = relationship("Environment", back_populates="restrictions")


class EnvironmentRequirement(Base):
    __tablename__ = "environment_requirements"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    qualification_id: Mapped[int] = mapped_column(
        ForeignKey("qualifications.id"), nullable=False
    )

    environment = relationship("Environment", back_populates="requirements")
    qualification = relationship("Qualification", back_populates="environment_requirements")


class EnvironmentMaintenance(Base):
    __tablename__ = "environment_maintenance"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)

    environment = relationship("Environment", back_populates="maintenances")
