from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.reservations import state_machine
from app.modules.reservations.checkin_rules import checkin_window_expired
from app.modules.reservations.models import Reservation, ReservationStatusHistory
from app.modules.reservations.repository import ReservationRepository
from app.modules.users.models import User
from app.shared.enums import AuditAction, ReservationStatus

_ENTITY_TYPE = "reservation"


class CheckinService:
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def get_reservation(self, reservation_id: int) -> Reservation | None:
        return self.repository.get_by_id(reservation_id)

    def checkin(self, reservation: Reservation, user: User) -> Reservation:
        tolerance_min = reservation.environment.noshow_tolerance_min
        if checkin_window_expired(
            reservation.start_time, tolerance_min, now=datetime.now(UTC)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Janela de tolerância expirada: check-in não permitido "
                    "(reserva sujeita a no-show)"
                ),
            )
        return self._execute(
            reservation,
            user,
            target=ReservationStatus.IN_USE,
            reason="Check-in realizado",
            timestamp_field="checkin_at",
            audit_action=AuditAction.CHECKIN,
        )

    def checkout(self, reservation: Reservation, user: User) -> Reservation:
        return self._execute(
            reservation,
            user,
            target=ReservationStatus.COMPLETED,
            reason="Check-out realizado",
            timestamp_field="checkout_at",
            audit_action=AuditAction.CHECKOUT,
        )

    def _execute(
        self,
        reservation: Reservation,
        user: User,
        *,
        target: ReservationStatus,
        reason: str,
        timestamp_field: str,
        audit_action: AuditAction,
    ) -> Reservation:
        self._require_self_or_responsible(reservation, user)
        now = datetime.now(UTC)
        self._transition(reservation, target, user, reason, now)
        setattr(reservation, timestamp_field, now)
        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=saved.id,
            action=audit_action,
            performed_by=user.id,
            after={timestamp_field: getattr(saved, timestamp_field).isoformat()},
        )
        return saved

    def _transition(
        self,
        reservation: Reservation,
        target: ReservationStatus,
        user: User,
        reason: str,
        now: datetime,
    ) -> None:
        current = ReservationStatus(reservation.status)
        try:
            state_machine.assert_transition(current, target)
        except state_machine.InvalidTransitionError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=str(exc)
            ) from exc
        reservation.status = target
        reservation.status_history.append(
            ReservationStatusHistory(
                previous_status=current,
                new_status=target,
                changed_at=now,
                reason=reason,
                user_id=user.id,
            )
        )

    def _require_self_or_responsible(
        self, reservation: Reservation, user: User
    ) -> None:
        if user.id not in (reservation.requester_id, reservation.responsible_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas solicitante ou responsável podem fazer check-in/out",
            )
