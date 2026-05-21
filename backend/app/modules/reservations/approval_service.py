# backend/app/modules/reservations/approval_service.py
from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.environments.models import Environment
from app.modules.reservations import buffer_manager, state_machine
from app.modules.reservations.models import (
    Approval,
    Reservation,
    ReservationStatusHistory,
)
from app.modules.reservations.repository import ReservationRepository
from app.modules.users.models import User
from app.shared.enums import ApprovalStatus, AuditAction, ReservationStatus


class ApprovalService:
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list_pending(self, *, skip: int = 0, limit: int = 100) -> list[Reservation]:
        return self.repository.list_pending(skip=skip, limit=limit)

    def approve(
        self, reservation: Reservation, approver: User, comments: str | None
    ) -> Reservation:
        return self._decide(
            reservation,
            approver,
            comments,
            target=ReservationStatus.APPROVED,
            approval_status=ApprovalStatus.APPROVED,
        )

    def reject(
        self, reservation: Reservation, approver: User, comments: str
    ) -> Reservation:
        if not comments or not comments.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Motivo obrigatório para rejeição",
            )
        return self._decide(
            reservation,
            approver,
            comments,
            target=ReservationStatus.REJECTED,
            approval_status=ApprovalStatus.REJECTED,
        )

    def _decide(
        self,
        reservation: Reservation,
        approver: User,
        comments: str | None,
        *,
        target: ReservationStatus,
        approval_status: ApprovalStatus,
    ) -> Reservation:
        current = ReservationStatus(reservation.status)
        try:
            state_machine.assert_transition(current, target)
        except state_machine.InvalidTransitionError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=str(exc)
            ) from exc

        now = datetime.now(UTC)
        reservation.status = target
        reservation.approvals.append(
            Approval(
                approver_id=approver.id,
                status=approval_status,
                type="INITIAL",
                decision_date=now,
                comments=comments,
            )
        )
        reservation.status_history.append(
            ReservationStatusHistory(
                previous_status=current,
                new_status=target,
                changed_at=now,
                reason=comments or f"{approval_status.value} por {approver.email}",
                user_id=approver.id,
            )
        )
        if target is ReservationStatus.APPROVED:
            environment = self.repository.db.get(
                Environment, reservation.environment_id
            )
            if environment is not None:
                buffer_manager.create_buffer_blocks(
                    reservation=reservation,
                    environment=environment,
                    session=self.repository.db,
                )
        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.APPROVE
            if approval_status is ApprovalStatus.APPROVED
            else AuditAction.REJECT,
            performed_by=approver.id,
            before={"status": current.value},
            after={"status": target.value},
        )
        return saved
