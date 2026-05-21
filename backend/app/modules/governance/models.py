from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.shared.enums import AppealStatus, PenaltyStatus, PenaltyType


class Penalty(Base):
    __tablename__ = "penalties"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservations.id"), nullable=False)
    type: Mapped[PenaltyType] = mapped_column(SAEnum(PenaltyType, name="penalty_type"), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    status: Mapped[PenaltyStatus] = mapped_column(SAEnum(PenaltyStatus, name="penalty_status"), nullable=False)
    duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    applied_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    user = relationship(
        "User", foreign_keys=[user_id], back_populates="penalties"
    )
    reservation = relationship("Reservation", back_populates="penalties")
    applied_by_user = relationship("User", foreign_keys=[applied_by])
    appeals = relationship(
        "Appeal", back_populates="penalty", cascade="all, delete-orphan"
    )


class Appeal(Base):
    __tablename__ = "appeals"

    penalty_id: Mapped[int] = mapped_column(
        ForeignKey("penalties.id"), nullable=False
    )
    status: Mapped[AppealStatus] = mapped_column(SAEnum(AppealStatus, name="appeal_status"), nullable=False)
    resolution_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    penalty = relationship("Penalty", back_populates="appeals")
