from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.environments.models import Environment
from app.modules.governance.restriction import RestrictionGuard
from app.modules.reservations import conflict_checker
from app.modules.reservations.conflict_checker import SUPPORT_UNAVAILABLE
from app.modules.reservations.composite_dependencies import dependency_pairs
from app.modules.reservations.models import (
    CompositeReservation,
    CompositeReservationItem,
    Reservation,
    ReservationDependency,
    ReservationStatusHistory,
)
from app.modules.reservations.repository import ReservationRepository
from app.modules.reservations.schemas import CompositeReservationCreate
from app.modules.reservations.service import _build_resources, _build_support
from app.modules.users.models import User
from app.shared.enums import (
    AuditAction,
    EnvironmentCriticality,
    ReservationStatus,
    ReservationType,
)


class CompositeService:
    def __init__(
        self,
        repository: ReservationRepository,
        audit: AuditService,
        restriction: RestrictionGuard,
    ) -> None:
        self.repository = repository
        self.audit = audit
        self.restriction = restriction

    def get(self, composite_id: int) -> CompositeReservation | None:
        return self.repository.db.get(CompositeReservation, composite_id)

    def create(
        self, payload: CompositeReservationCreate, current_user: User
    ) -> CompositeReservation:
        self.restriction.assert_allowed(user_id=current_user.id)
        envs: dict[int, Environment] = {}
        # Valida TODOS os itens ANTES de criar QUALQUER reserva (UC07 E2 — atomicidade)
        for item in payload.items:
            env = envs.get(item.environment_id) or self.repository.db.get(
                Environment, item.environment_id
            )
            if env is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ambiente {item.environment_id} não encontrado",
                )
            envs[item.environment_id] = env
            report = conflict_checker.check_reservation(
                repository=self.repository,
                environment=env,
                start=item.start_time,
                end=item.end_time,
                participant_count=item.participant_count,
                resource_ids=[r.resource_id for r in item.resources],
                requester_id=current_user.id,
                requester_role_ids=[ur.role_id for ur in current_user.user_roles],
                required_support=[s.support_type for s in item.support],
            )
            hard_conflicts = [
                c for c in report.conflicts if c.type != SUPPORT_UNAVAILABLE
            ]
            if hard_conflicts:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "message": (f"Conflito no item ambiente {item.environment_id}"),
                        "conflicts": [
                            {"type": c.type, "detail": c.detail} for c in hard_conflicts
                        ],
                    },
                )

        now = datetime.now(UTC)
        composite = CompositeReservation(
            name=payload.name, description=payload.description
        )
        self.repository.db.add(composite)
        self.repository.db.flush()

        for idx, item in enumerate(payload.items):
            env = envs[item.environment_id]
            initial_status = (
                ReservationStatus.APPROVED
                if env.criticality == EnvironmentCriticality.COMMON
                and not env.requires_approval
                else ReservationStatus.PENDING_APPROVAL
            )
            reservation = Reservation(
                environment_id=item.environment_id,
                requester_id=current_user.id,
                responsible_id=payload.responsible_id,
                start_time=item.start_time,
                end_time=item.end_time,
                status=initial_status,
                type=ReservationType.COMPOSITE_CHILD,
                purpose=item.purpose,
                participant_count=item.participant_count,
                terms_accepted_at=now,
            )
            reservation.resources = _build_resources(item.resources)
            reservation.support = _build_support(item.support)
            reservation.status_history = [
                ReservationStatusHistory(
                    previous_status=None,
                    new_status=initial_status,
                    changed_at=now,
                    reason=(
                        f"Item composto {idx + 1}/{len(payload.items)} ({payload.name})"
                    ),
                    user_id=current_user.id,
                )
            ]
            self.repository.db.add(reservation)
            self.repository.db.flush()
            composite.items.append(
                CompositeReservationItem(
                    reservation_id=reservation.id,
                    critical=item.critical,
                    order=idx,
                )
            )

        item_pairs = [
            (ci.reservation_id, ci.critical) for ci in composite.items
        ]
        for dependent_id, prereq_id in dependency_pairs(item_pairs):
            self.repository.db.add(
                ReservationDependency(
                    reservation_id=dependent_id,
                    dependent_reservation_id=prereq_id,
                )
            )

        self.repository.db.commit()
        self.repository.db.refresh(composite)

        self.audit.record(
            entity_type="composite_reservation",
            target_id=composite.id,
            action=AuditAction.CREATE,
            performed_by=current_user.id,
            after={"items": [i.reservation_id for i in composite.items]},
        )
        return composite

    def cancel_item(
        self,
        composite_id: int,
        reservation_id: int,
        reason: str,
        current_user: User,
    ) -> CompositeReservation:
        """Cancela um item da composta e, se for crítico, força os demais
        para PENDING_APPROVAL (revisão obrigatória — UC07 E1)."""
        composite = self.repository.db.get(CompositeReservation, composite_id)
        if composite is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reserva composta não encontrada",
            )
        target_item = next(
            (i for i in composite.items if i.reservation_id == reservation_id),
            None,
        )
        if target_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item não pertence à reserva composta",
            )

        target_res = self.repository.db.get(Reservation, reservation_id)
        if target_res is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reserva não encontrada",
            )

        from app.modules.reservations import state_machine

        now = datetime.now(UTC)
        current = ReservationStatus(target_res.status)
        try:
            state_machine.assert_transition(current, ReservationStatus.CANCELLED)
        except state_machine.InvalidTransitionError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=str(exc)
            ) from exc

        target_res.status = ReservationStatus.CANCELLED
        target_res.status_history.append(
            ReservationStatusHistory(
                previous_status=current,
                new_status=ReservationStatus.CANCELLED,
                changed_at=now,
                reason=reason,
                user_id=current_user.id,
            )
        )
        self.audit.record(
            entity_type="reservation",
            target_id=target_res.id,
            action=AuditAction.CANCEL,
            performed_by=current_user.id,
            before={"status": current.value},
            after={"status": ReservationStatus.CANCELLED.value},
        )

        if target_item.critical:
            for item in composite.items:
                if item.reservation_id == reservation_id:
                    continue
                other = self.repository.db.get(Reservation, item.reservation_id)
                if other is None:
                    continue
                other_status = ReservationStatus(other.status)
                if other_status in (
                    ReservationStatus.APPROVED,
                    ReservationStatus.PENDING_APPROVAL,
                ):
                    other.status = ReservationStatus.PENDING_APPROVAL
                    other.status_history.append(
                        ReservationStatusHistory(
                            previous_status=other_status,
                            new_status=ReservationStatus.PENDING_APPROVAL,
                            changed_at=now,
                            reason=(
                                f"Revisão obrigatória: item crítico "
                                f"#{reservation_id} cancelado"
                            ),
                            user_id=current_user.id,
                        )
                    )
                    self.audit.record(
                        entity_type="reservation",
                        target_id=other.id,
                        action=AuditAction.UPDATE,
                        performed_by=current_user.id,
                        before={"status": other_status.value},
                        after={"status": ReservationStatus.PENDING_APPROVAL.value},
                    )

        self.repository.db.commit()
        self.repository.db.refresh(composite)
        return composite
