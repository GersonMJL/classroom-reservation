from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Resource(Base):
    __tablename__ = "resources"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(
        String(64), nullable=False, server_default="GENERAL"
    )
    attachment_type: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default="MOBILE"
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    current_location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id"), nullable=True
    )
    environment_id: Mapped[int | None] = mapped_column(
        ForeignKey("environments.id"), nullable=True
    )

    current_location = relationship("Location", back_populates="resources")
    environment = relationship("Environment", back_populates="resources")
    reservation_resources = relationship("ReservationResource", back_populates="resource")
    availabilities = relationship(
        "ResourceAvailability",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    loans = relationship("ResourceLoan", back_populates="resource")


class ResourceAvailability(Base):
    __tablename__ = "resource_availability"

    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)
    start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    resource = relationship("Resource", back_populates="availabilities")


class TechnicianSchedule(Base):
    __tablename__ = "technician_schedule"

    technician_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    technician = relationship("User")
    resource = relationship("Resource")


class ResourceMaintenance(Base):
    __tablename__ = "resource_maintenance"

    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)

    resource = relationship("Resource")
