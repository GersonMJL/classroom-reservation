from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.environments.models import Environment
from app.modules.reservations import conflict_checker
from app.modules.reservations.conflict_checker import SUPPORT_UNAVAILABLE
from app.modules.reservations.models import (
    CompositeReservation,
    CompositeReservationItem,
    Reservation,
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
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def get(self, composite_id: int) -> CompositeReservation | None:
        return self.repository.db.get(CompositeReservation, composite_id)

    def create(
        self, payload: CompositeReservationCreate, current_user: User
    ) -> CompositeReservation:
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
