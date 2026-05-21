from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.reservations import state_machine
from app.modules.reservations.models import Reservation, ReservationStatusHistory
from app.modules.reservations.repository import ReservationRepository
from app.modules.users.models import User
from app.shared.enums import AuditAction, ReservationStatus


class CheckinService:
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def checkin(self, reservation: Reservation, user: User) -> Reservation:
        self._require_self_or_responsible(reservation, user)
        self._transition(
            reservation, ReservationStatus.IN_USE, user, "Check-in realizado"
        )
        reservation.checkin_at = datetime.now(UTC)
        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.CHECKIN,
            performed_by=user.id,
            after={"checkin_at": saved.checkin_at.isoformat()},
        )
        return saved

    def checkout(self, reservation: Reservation, user: User) -> Reservation:
        self._require_self_or_responsible(reservation, user)
        self._transition(
            reservation, ReservationStatus.COMPLETED, user, "Check-out realizado"
        )
        reservation.checkout_at = datetime.now(UTC)
        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.CHECKOUT,
            performed_by=user.id,
            after={"checkout_at": saved.checkout_at.isoformat()},
        )
        return saved

    def _transition(
        self,
        reservation: Reservation,
        target: ReservationStatus,
        user: User,
        reason: str,
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
                changed_at=datetime.now(UTC),
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
