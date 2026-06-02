from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.audit.audit_service import build_audit_service
from app.modules.environments.models import Environment
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.governance.penalty_service import PenaltyService
from app.modules.notifications.service import build_notification_service
from app.modules.reservations.models import Reservation, ReservationStatusHistory
from app.shared.enums import AuditAction, ReservationStatus


def mark_noshows(db: Session, *, now: datetime | None = None) -> list[int]:
    """Marca como NO_SHOW reservas APPROVED cujo (start_time + tolerância) já passou
    sem check-in. Retorna IDs alterados."""
    now = now or datetime.now(UTC)
    audit = build_audit_service(db)
    penalty_service = PenaltyService(
        repository=PenaltyRepository(db=db),
        audit=audit,
        notifications=build_notification_service(db),
    )

    candidates = (
        db.execute(
            select(Reservation, Environment)
            .join(Environment, Environment.id == Reservation.environment_id)
            .where(Reservation.status == ReservationStatus.APPROVED)
            .where(Reservation.checkin_at.is_(None))
        )
        .tuples()
        .all()
    )

    changed: list[int] = []
    for reservation, environment in candidates:
        deadline = reservation.start_time + timedelta(
            minutes=environment.noshow_tolerance_min
        )
        if now < deadline:
            continue
        reservation.status = ReservationStatus.NO_SHOW
        reservation.status_history.append(
            ReservationStatusHistory(
                previous_status=ReservationStatus.APPROVED,
                new_status=ReservationStatus.NO_SHOW,
                changed_at=now,
                reason="No-show automático: tolerância vencida sem check-in",
                user_id=reservation.requester_id,
            )
        )
        audit.record(
            entity_type="reservation",
            target_id=reservation.id,
            action=AuditAction.UPDATE,
            performed_by=reservation.requester_id,
            before={"status": "APPROVED"},
            after={"status": "NO_SHOW"},
        )
        changed.append(reservation.id)
        penalty_service.apply_no_show(
            user_id=reservation.requester_id,
            reservation_id=reservation.id,
        )

    if changed:
        db.commit()
    return changed
