from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.shared.enums import (
    ApprovalStatus,
    BufferType,
    CalendarBlockType,
    ReservationPurpose,
    ReservationStatus,
    ReservationType,
    SupportType,
)


class Reservation(Base):
    __tablename__ = "reservations"

    parent_reservation_id: Mapped[int | None] = mapped_column(
        ForeignKey("reservations.id"), nullable=True
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
    status: Mapped[str] = mapped_column(
        SAEnum(ReservationStatus, name="reservation_status"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        SAEnum(ReservationType, name="reservation_type"), nullable=False
    )
    participant_count: Mapped[int] = mapped_column(Integer, nullable=False)
    purpose: Mapped[str] = mapped_column(
        SAEnum(ReservationPurpose, name="reservation_purpose"), nullable=False
    )
    checkin_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checkout_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    terms_accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    recurrence_rule: Mapped[str | None] = mapped_column(String(255), nullable=True)

    parent_reservation = relationship(
        "Reservation", remote_side="Reservation.id", back_populates="child_reservations"
    )
    child_reservations = relationship(
        "Reservation", back_populates="parent_reservation"
    )

    environment = relationship("Environment", back_populates="reservations")
    requester = relationship(
        "User",
        foreign_keys=[requester_id],
        back_populates="requested_reservations",
    )
    responsible = relationship(
        "User",
        foreign_keys=[responsible_id],
        back_populates="managed_reservations",
    )

    dependencies = relationship(
        "ReservationDependency",
        foreign_keys="ReservationDependency.reservation_id",
        back_populates="reservation",
        cascade="all, delete-orphan",
    )
    depended_on_by = relationship(
        "ReservationDependency",
        foreign_keys="ReservationDependency.dependent_reservation_id",
        back_populates="depends_on_reservation",
    )
    resources = relationship(
        "ReservationResource",
        back_populates="reservation",
        cascade="all, delete-orphan",
    )
    support = relationship(
        "ReservationSupport", back_populates="reservation", cascade="all, delete-orphan"
    )
    approvals = relationship(
        "Approval", back_populates="reservation", cascade="all, delete-orphan"
    )
    incidents = relationship(
        "Incident", back_populates="reservation", cascade="all, delete-orphan"
    )
    penalties = relationship("Penalty", back_populates="reservation")
    versions = relationship(
        "ReservationVersion", back_populates="reservation", cascade="all, delete-orphan"
    )
    resource_loans = relationship("ResourceLoan", back_populates="reservation")
    status_history = relationship(
        "ReservationStatusHistory",
        back_populates="reservation",
        cascade="all, delete-orphan",
    )
    buffers = relationship(
        "ExecutionBuffer", back_populates="reservation", cascade="all, delete-orphan"
    )


class ReservationDependency(Base):
    __tablename__ = "reservation_dependencies"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    dependent_reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )

    reservation = relationship(
        "Reservation", foreign_keys=[reservation_id], back_populates="dependencies"
    )
    depends_on_reservation = relationship(
        "Reservation",
        foreign_keys=[dependent_reservation_id],
        back_populates="depended_on_by",
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
    support_type: Mapped[str] = mapped_column(
        SAEnum(SupportType, name="support_type"), nullable=False
    )
    responsible_staff_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    reservation = relationship("Reservation", back_populates="support")
    responsible_staff = relationship("User", back_populates="assigned_support")


class Approval(Base):
    __tablename__ = "approvals"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    approver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(ApprovalStatus, name="approval_status"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(64), nullable=False, server_default="INITIAL"
    )
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
    type: Mapped[str] = mapped_column(
        SAEnum(CalendarBlockType, name="calendar_block_type"), nullable=False
    )
    priority: Mapped[str] = mapped_column(String(64), nullable=False)

    environment = relationship("Environment", back_populates="calendar_blocks")


class ReservationStatusHistory(Base):
    __tablename__ = "reservation_status_history"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    previous_status: Mapped[str | None] = mapped_column(
        SAEnum(ReservationStatus, name="reservation_status"), nullable=True
    )
    new_status: Mapped[str] = mapped_column(
        SAEnum(ReservationStatus, name="reservation_status"), nullable=False
    )
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    reservation = relationship("Reservation", back_populates="status_history")
    user = relationship("User")


class ExecutionBuffer(Base):
    __tablename__ = "execution_buffers"

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        SAEnum(BufferType, name="buffer_type"), nullable=False
    )
    expected_end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    actual_end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    released_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    reservation = relationship("Reservation", back_populates="buffers")
    environment = relationship("Environment")
    released_by_user = relationship("User", foreign_keys=[released_by])


class CompositeReservation(Base):
    __tablename__ = "composite_reservations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    items = relationship(
        "CompositeReservationItem",
        back_populates="composite_reservation",
        cascade="all, delete-orphan",
    )


class CompositeReservationItem(Base):
    __tablename__ = "composite_reservation_items"
    __table_args__ = (
        UniqueConstraint(
            "composite_reservation_id",
            "reservation_id",
            name="uq_composite_reservation_item",
        ),
    )

    composite_reservation_id: Mapped[int] = mapped_column(
        ForeignKey("composite_reservations.id"), nullable=False
    )
    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False
    )
    critical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    composite_reservation = relationship("CompositeReservation", back_populates="items")
    reservation = relationship("Reservation")
