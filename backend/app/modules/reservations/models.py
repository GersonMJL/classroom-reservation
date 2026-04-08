from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Reservation(Base):
    __tablename__ = "reservations"

    parent_reservation_id: Mapped[int | None] = mapped_column(
        ForeignKey("reservations.id"),
        nullable=True,
    )
    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    responsible_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    participant_count: Mapped[int] = mapped_column(Integer, nullable=False)
    purpose: Mapped[str] = mapped_column(String(128), nullable=False)

    parent = relationship(
        "Reservation", remote_side="Reservation.id", back_populates="children"
    )
    children = relationship("Reservation", back_populates="parent")

    environment = relationship("Environment", back_populates="reservations")
    requester = relationship(
        "User", foreign_keys=[requester_id], back_populates="requested_reservations"
    )
    responsible = relationship(
        "User", foreign_keys=[responsible_id], back_populates="responsible_reservations"
    )

    dependencies = relationship(
        "ReservationDependency",
        foreign_keys="ReservationDependency.reservation_id",
        back_populates="reservation",
        cascade="all, delete-orphan",
    )
    depended_by = relationship(
        "ReservationDependency",
        foreign_keys="ReservationDependency.depends_on_reservation_id",
        back_populates="depends_on_reservation",
    )
    resources = relationship(
        "ReservationResource",
        back_populates="reservation",
        cascade="all, delete-orphan",
    )
    supports = relationship(
        "ReservationSupport", back_populates="reservation", cascade="all, delete-orphan"
    )
    approvals = relationship(
        "Approval", back_populates="reservation", cascade="all, delete-orphan"
    )
    checkins = relationship(
        "Checkin", back_populates="reservation", cascade="all, delete-orphan"
    )
    checkouts = relationship(
        "Checkout", back_populates="reservation", cascade="all, delete-orphan"
    )
    incidents = relationship(
        "Incident", back_populates="reservation", cascade="all, delete-orphan"
    )
    penalties = relationship("Penalty", back_populates="reservation")
    versions = relationship(
        "ReservationVersion", back_populates="reservation", cascade="all, delete-orphan"
    )
    resource_checkouts = relationship("ResourceCheckout", back_populates="reservation")


class ReservationDependency(Base):
    __tablename__ = "reservation_dependencies"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    depends_on_reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )

    reservation = relationship(
        "Reservation", foreign_keys=[reservation_id], back_populates="dependencies"
    )
    depends_on_reservation = relationship(
        "Reservation",
        foreign_keys=[depends_on_reservation_id],
        back_populates="depended_by",
    )


class ReservationResource(Base):
    __tablename__ = "reservation_resources"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)

    reservation = relationship("Reservation", back_populates="resources")
    resource = relationship("Resource", back_populates="reservation_resources")


class ReservationSupport(Base):
    __tablename__ = "reservation_support"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    support_type: Mapped[str] = mapped_column(String(64), nullable=False)
    assigned_staff_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    reservation = relationship("Reservation", back_populates="supports")
    assigned_staff = relationship("User", back_populates="assigned_supports")


class Approval(Base):
    __tablename__ = "approvals"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    approver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    decision_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    comments: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    reservation = relationship("Reservation", back_populates="approvals")
    approver = relationship("User", back_populates="approvals")


class CalendarBlock(Base):
    __tablename__ = "calendar_blocks"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    priority: Mapped[str] = mapped_column(String(64), nullable=False)

    environment = relationship("Environment", back_populates="calendar_blocks")
