from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.modules.audit.audit_service import build_audit_service
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.governance.penalty_service import PenaltyService
from app.modules.notifications.service import build_notification_service
from app.modules.reservations.models import Reservation, ReservationStatusHistory
from app.shared.enums import AuditAction, ReservationStatus


def mark_overtime(db: Session, *, now: datetime | None = None) -> list[int]:
    """Reservas IN_USE sem check-out além do prazo de tolerância viram COMPLETED
    com penalidade OVERTIME ao responsável. Retorna IDs alterados."""
    now = now or datetime.now(UTC)
    grace = get_settings().overtime_grace_minutes
    audit = build_audit_service(db)
    penalty_service = PenaltyService(
        repository=PenaltyRepository(db=db),
        audit=audit,
        notifications=build_notification_service(db),
    )

    candidates = (
        db.execute(
            select(Reservation)
            .where(Reservation.status == ReservationStatus.IN_USE)
            .where(Reservation.checkout_at.is_(None))
        )
        .scalars()
        .all()
    )

    changed: list[int] = []
    for reservation in candidates:
        deadline = reservation.end_time + timedelta(minutes=grace)
        if now < deadline:
            continue
        reservation.status = ReservationStatus.COMPLETED
        reservation.checkout_at = now
        reservation.status_history.append(
            ReservationStatusHistory(
                previous_status=ReservationStatus.IN_USE,
                new_status=ReservationStatus.COMPLETED,
                changed_at=now,
                reason="Check-out automático por excesso de tempo",
                user_id=reservation.responsible_id,
            )
        )
        audit.record(
            entity_type="reservation",
            target_id=reservation.id,
            action=AuditAction.CHECKOUT,
            performed_by=reservation.responsible_id,
            before={"status": "IN_USE"},
            after={"status": "COMPLETED", "auto": True},
        )
        changed.append(reservation.id)
        penalty_service.apply_overtime(
            user_id=reservation.responsible_id,
            reservation_id=reservation.id,
        )

    if changed:
        db.commit()
    return changed
