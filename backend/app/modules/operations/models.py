from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Checkin(Base):
    __tablename__ = "checkins"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    checkin_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    method: Mapped[str] = mapped_column(String(64), nullable=False)

    reservation = relationship("Reservation", back_populates="checkins")


class Checkout(Base):
    __tablename__ = "checkouts"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    checkout_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    checklist_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    reservation = relationship("Reservation", back_populates="checkouts")


class Incident(Base):
    __tablename__ = "incidents"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), nullable=False)
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    reservation = relationship("Reservation", back_populates="incidents")


class ResourceCheckout(Base):
    __tablename__ = "resource_checkouts"

    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)
    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    checkout_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    due_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    return_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    resource = relationship("Resource", back_populates="resource_checkouts")
    reservation = relationship("Reservation", back_populates="resource_checkouts")
