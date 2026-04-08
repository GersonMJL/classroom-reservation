from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Resource(Base):
    __tablename__ = "resources"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    is_mobile: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    current_location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id"), nullable=True
    )

    current_location = relationship("Location", back_populates="resources")
    environment_links = relationship("EnvironmentResource", back_populates="resource")
    reservation_resources = relationship(
        "ReservationResource", back_populates="resource"
    )
    calendar_entries = relationship(
        "ResourceCalendar", back_populates="resource", cascade="all, delete-orphan"
    )
    resource_checkouts = relationship("ResourceCheckout", back_populates="resource")


class ResourceCalendar(Base):
    __tablename__ = "resource_calendar"

    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    resource = relationship("Resource", back_populates="calendar_entries")
