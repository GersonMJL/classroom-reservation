from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.environments.models import Environment
from app.modules.reservations import conflict_checker, state_machine
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
from app.shared.enums import ReservationStatus, ReservationType


class ReservationService:
    def __init__(self, repository: ReservationRepository) -> None:
        self.repository = repository

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
        if payload.type is not ReservationType.SIMPLE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Tipo de reserva não suportado nesta versão",
            )

        environment = self.repository.db.get(Environment, payload.environment_id)
        if environment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambiente não encontrado",
            )

        resource_ids = [r.resource_id for r in payload.resources]
        report = conflict_checker.check_reservation(
            repository=self.repository,
            environment=environment,
            start=payload.start_time,
            end=payload.end_time,
            participant_count=payload.participant_count,
            resource_ids=resource_ids,
            requester_role_ids=[ur.role_id for ur in current_user.user_roles],
        )
        _raise_if_conflicts(report)

        reservation = Reservation(
            environment_id=payload.environment_id,
            requester_id=payload.requester_id,
            responsible_id=payload.responsible_id,
            start_time=payload.start_time,
            end_time=payload.end_time,
            status=ReservationStatus.PENDING_APPROVAL,
            type=ReservationType.SIMPLE,
            purpose=payload.purpose,
            participant_count=payload.participant_count,
        )
        reservation.resources = _build_resources(payload.resources)
        reservation.support = _build_support(payload.support)
        reservation.status_history = [
            _history_entry(
                previous=None,
                new=ReservationStatus.PENDING_APPROVAL,
                user_id=current_user.id,
                reason="Criação da reserva",
            )
        ]
        return self.repository.add(reservation)

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

        needs_conflict_check = any(
            key in data
            for key in (
                "environment_id",
                "start_time",
                "end_time",
                "participant_count",
                "resources",
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
                requester_role_ids=[ur.role_id for ur in current_user.user_roles],
                exclude_id=reservation.id,
            )
            _raise_if_conflicts(report)

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

        return self.repository.save(reservation)

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

        reservation.status = target
        reservation.status_history.append(
            _history_entry(
                previous=current,
                new=target,
                user_id=current_user.id,
                reason=reason,
            )
        )
        return self.repository.save(reservation)


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


def _raise_if_conflicts(report: conflict_checker.ConflictReport) -> None:
    if not report.has_conflicts:
        return
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "message": "Conflitos impedem a criação/edição da reserva",
            "conflicts": [
                {"type": c.type, "detail": c.detail} for c in report.conflicts
            ],
        },
    )
