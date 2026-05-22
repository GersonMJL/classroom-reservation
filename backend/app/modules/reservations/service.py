from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.environments.models import Environment
from app.modules.reservations import buffer_manager, conflict_checker, state_machine
from app.modules.reservations.recurrence import expand_weekly
from app.modules.reservations.conflict_checker import SUPPORT_UNAVAILABLE
from app.modules.reservations.models import (
    Reservation,
    ReservationResource,
    ReservationStatusHistory,
    ReservationSupport,
)
from app.modules.reservations.repository import ReservationRepository
from app.modules.reservations.schemas import (
    ReservationCreate,
    ReservationResourceCreate,
    ReservationSupportCreate,
    ReservationUpdate,
)
from app.modules.users.models import User
from app.shared.enums import (
    AuditAction,
    EnvironmentCriticality,
    ReservationStatus,
    ReservationType,
)


class ReservationService:
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    # ----------- consultas -----------

    def list_reservations(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        environment_id: int | None = None,
        requester_id: int | None = None,
        status: ReservationStatus | None = None,
        start_after: datetime | None = None,
        end_before: datetime | None = None,
    ) -> list[Reservation]:
        return self.repository.list(
            skip=skip,
            limit=limit,
            environment_id=environment_id,
            requester_id=requester_id,
            status=status,
            start_after=start_after,
            end_before=end_before,
        )

    def get_reservation(self, reservation_id: int) -> Reservation | None:
        return self.repository.get_by_id(reservation_id)

    # ----------- mutações -----------

    def create_reservation(
        self, payload: ReservationCreate, current_user: User
    ) -> Reservation:
        if payload.type is ReservationType.RECURRING:
            return self._create_recurring(payload, current_user)
        if payload.type is not ReservationType.SIMPLE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Tipo de reserva não suportado",
            )

        environment = self.repository.db.get(Environment, payload.environment_id)
        if environment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambiente não encontrado",
            )

        resource_ids = [r.resource_id for r in payload.resources]
        required_support = [s.support_type for s in payload.support]
        report = conflict_checker.check_reservation(
            repository=self.repository,
            environment=environment,
            start=payload.start_time,
            end=payload.end_time,
            participant_count=payload.participant_count,
            resource_ids=resource_ids,
            requester_id=payload.requester_id,
            requester_role_ids=[ur.role_id for ur in current_user.user_roles],
            required_support=required_support,
        )
        _raise_if_conflicts(report, soft_types=frozenset({SUPPORT_UNAVAILABLE}))

        has_support_conflict = any(
            c.type == SUPPORT_UNAVAILABLE for c in report.conflicts
        )
        initial_status = (
            ReservationStatus.APPROVED
            if environment.criticality == EnvironmentCriticality.COMMON
            and not environment.requires_approval
            and not has_support_conflict
            else ReservationStatus.PENDING_APPROVAL
        )
        initial_reason = (
            "Auto-aprovada (ambiente comum, sem conflitos)"
            if initial_status is ReservationStatus.APPROVED
            else (
                "Aguardando confirmação de suporte"
                if has_support_conflict
                else "Criação da reserva"
            )
        )

        reservation = Reservation(
            environment_id=payload.environment_id,
            requester_id=payload.requester_id,
            responsible_id=payload.responsible_id,
            start_time=payload.start_time,
            end_time=payload.end_time,
            status=initial_status,
            type=ReservationType.SIMPLE,
            purpose=payload.purpose,
            participant_count=payload.participant_count,
        )
        reservation.terms_accepted_at = datetime.now(UTC)
        reservation.resources = _build_resources(payload.resources)
        reservation.support = _build_support(payload.support)
        reservation.status_history = [
            _history_entry(
                previous=None,
                new=initial_status,
                user_id=current_user.id,
                reason=initial_reason,
            )
        ]
        saved = self.repository.add(reservation)
        if initial_status is ReservationStatus.APPROVED:
            buffer_manager.create_buffer_blocks(
                reservation=saved,
                environment=environment,
                session=self.repository.db,
            )
            self.repository.db.commit()
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=current_user.id,
            before=None,
            after=_snapshot(saved),
        )
        return saved

    def update_reservation(
        self,
        reservation: Reservation,
        payload: ReservationUpdate,
        current_user: User,
    ) -> Reservation:
        if not state_machine.can_edit(ReservationStatus(reservation.status)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Reserva não pode ser editada neste status",
            )

        before_snapshot = _snapshot(reservation)
        data = payload.model_dump(exclude_unset=True)
        new_start = data.get("start_time", reservation.start_time)
        new_end = data.get("end_time", reservation.end_time)
        new_env_id = data.get("environment_id", reservation.environment_id)
        new_participant = data.get("participant_count", reservation.participant_count)
        new_resources = data.get(
            "resources",
            [{"resource_id": r.resource_id} for r in reservation.resources],
        )
        resource_ids = [r["resource_id"] for r in new_resources]
        new_support = data.get(
            "support",
            [{"support_type": s.support_type} for s in reservation.support],
        )
        new_support_types = [s["support_type"] for s in new_support]

        needs_conflict_check = any(
            key in data
            for key in (
                "environment_id",
                "start_time",
                "end_time",
                "participant_count",
                "resources",
                "support",
            )
        )
        if needs_conflict_check:
            environment = self.repository.db.get(Environment, new_env_id)
            if environment is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ambiente não encontrado",
                )
            report = conflict_checker.check_reservation(
                repository=self.repository,
                environment=environment,
                start=new_start,
                end=new_end,
                participant_count=new_participant,
                resource_ids=resource_ids,
                requester_id=reservation.requester_id,
                requester_role_ids=[ur.role_id for ur in current_user.user_roles],
                required_support=new_support_types,
                exclude_id=reservation.id,
            )
            _raise_if_conflicts(report, soft_types=frozenset({SUPPORT_UNAVAILABLE}))

        for field_name in (
            "environment_id",
            "responsible_id",
            "start_time",
            "end_time",
            "purpose",
            "participant_count",
        ):
            if field_name in data:
                setattr(reservation, field_name, data[field_name])

        if "resources" in data:
            reservation.resources = _build_resources(
                [ReservationResourceCreate(**r) for r in data["resources"]]
            )
        if "support" in data:
            reservation.support = _build_support(
                [ReservationSupportCreate(**s) for s in data["support"]]
            )

        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.UPDATE,
            performed_by=current_user.id,
            before=before_snapshot,
            after=_snapshot(saved),
        )
        return saved

    def cancel_reservation(
        self, reservation: Reservation, reason: str, current_user: User
    ) -> Reservation:
        current = ReservationStatus(reservation.status)
        target = ReservationStatus.CANCELLED
        try:
            state_machine.assert_transition(current, target)
        except state_machine.InvalidTransitionError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=str(exc)
            ) from exc

        before_snapshot = _snapshot(reservation)
        reservation.status = target
        reservation.status_history.append(
            _history_entry(
                previous=current,
                new=target,
                user_id=current_user.id,
                reason=reason,
            )
        )
        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.CANCEL,
            performed_by=current_user.id,
            before=before_snapshot,
            after=_snapshot(saved),
        )
        return saved

    def _create_recurring(
        self, payload: ReservationCreate, current_user: User
    ) -> Reservation:
        environment = self.repository.db.get(Environment, payload.environment_id)
        if environment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Ambiente não encontrado"
            )

        assert payload.recurrence is not None  # schema enforces this
        slots = expand_weekly(
            payload.start_time,
            payload.end_time,
            weekdays=payload.recurrence.weekdays,
            occurrences=payload.recurrence.occurrences,
        )
        if not slots:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Recorrência não produziu nenhuma ocorrência",
            )

        resource_ids = [r.resource_id for r in payload.resources]
        required_support = [s.support_type for s in payload.support]

        # Valida TODOS os slots ANTES de inserir qualquer um — falha atômica
        for slot_start, slot_end in slots:
            report = conflict_checker.check_reservation(
                repository=self.repository,
                environment=environment,
                start=slot_start,
                end=slot_end,
                participant_count=payload.participant_count,
                resource_ids=resource_ids,
                requester_id=payload.requester_id,
                requester_role_ids=[ur.role_id for ur in current_user.user_roles],
                required_support=required_support,
            )
            _raise_if_conflicts(report, soft_types=frozenset({SUPPORT_UNAVAILABLE}))

        initial_status = (
            ReservationStatus.APPROVED
            if environment.criticality == EnvironmentCriticality.COMMON
            and not environment.requires_approval
            else ReservationStatus.PENDING_APPROVAL
        )
        now = datetime.now(UTC)

        parent: Reservation | None = None
        for idx, (slot_start, slot_end) in enumerate(slots):
            child = Reservation(
                parent_reservation_id=parent.id if parent else None,
                environment_id=payload.environment_id,
                requester_id=payload.requester_id,
                responsible_id=payload.responsible_id,
                start_time=slot_start,
                end_time=slot_end,
                status=initial_status,
                type=ReservationType.RECURRING,
                purpose=payload.purpose,
                participant_count=payload.participant_count,
                terms_accepted_at=now,
            )
            child.resources = _build_resources(payload.resources)
            child.support = _build_support(payload.support)
            child.status_history = [
                _history_entry(
                    previous=None,
                    new=initial_status,
                    user_id=current_user.id,
                    reason=f"Reserva recorrente {idx + 1}/{len(slots)}",
                )
            ]
            saved = self.repository.add(child)
            self.audit.record(
                entity_type="reservation",
                target_id=saved.id,
                action=AuditAction.CREATE,
                performed_by=current_user.id,
                after=_snapshot(saved),
            )
            if parent is None:
                parent = saved
            else:
                saved.parent_reservation_id = parent.id
                self.repository.save(saved)

        return parent  # type: ignore[return-value]


def _build_resources(
    items: list[ReservationResourceCreate],
) -> list[ReservationResource]:
    return [ReservationResource(resource_id=i.resource_id) for i in items]


def _build_support(
    items: list[ReservationSupportCreate],
) -> list[ReservationSupport]:
    return [
        ReservationSupport(
            support_type=i.support_type,
            responsible_staff_id=i.responsible_staff_id,
        )
        for i in items
    ]


def _history_entry(
    *,
    previous: ReservationStatus | None,
    new: ReservationStatus,
    user_id: int,
    reason: str,
) -> ReservationStatusHistory:
    return ReservationStatusHistory(
        previous_status=previous,
        new_status=new,
        changed_at=datetime.now(UTC),
        reason=reason,
        user_id=user_id,
    )


def _raise_if_conflicts(
    report: conflict_checker.ConflictReport,
    *,
    soft_types: frozenset[str] = frozenset(),
) -> None:
    hard_conflicts = [c for c in report.conflicts if c.type not in soft_types]
    if not hard_conflicts:
        return
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "message": "Conflitos impedem a criação/edição da reserva",
            "conflicts": [{"type": c.type, "detail": c.detail} for c in hard_conflicts],
        },
    )


def _snapshot(reservation: Reservation) -> dict[str, Any]:
    return {
        "id": reservation.id,
        "status": reservation.status,
        "environment_id": reservation.environment_id,
        "start_time": reservation.start_time.isoformat()
        if reservation.start_time
        else None,
        "end_time": reservation.end_time.isoformat() if reservation.end_time else None,
        "participant_count": reservation.participant_count,
        "purpose": reservation.purpose,
        "resources": [r.resource_id for r in reservation.resources],
    }
