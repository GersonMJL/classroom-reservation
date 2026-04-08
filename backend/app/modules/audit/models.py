from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ReservationVersion(Base):
    __tablename__ = "reservation_versions"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    changed_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    change_summary: Mapped[str] = mapped_column(String(1000), nullable=False)

    reservation = relationship("Reservation", back_populates="versions")
    changed_by_user = relationship("User", back_populates="reservation_versions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    entity_type: Mapped[str] = mapped_column(String(128), nullable=False)
    target_id: Mapped[int] = mapped_column(nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    performed_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    performed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    before_state: Mapped[str | None] = mapped_column(String(4000), nullable=True)
    after_state: Mapped[str | None] = mapped_column(String(4000), nullable=True)

    performed_by_user = relationship("User", back_populates="audit_logs")
