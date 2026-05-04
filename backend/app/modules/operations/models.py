from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservations.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    severity: Mapped[str] = mapped_column(String(64), nullable=False)
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    reservation = relationship("Reservation", back_populates="incidents")


class ResourceLoan(Base):
    __tablename__ = "resource_loans"

    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)
    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservations.id"), nullable=False)
    checkout_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    expected_return_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    return_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    resource = relationship("Resource", back_populates="loans")
    reservation = relationship("Reservation", back_populates="resource_loans")
