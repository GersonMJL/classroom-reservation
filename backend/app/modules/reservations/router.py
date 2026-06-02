from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import build_audit_service
from app.modules.notifications.service import build_notification_service
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.governance.restriction import RestrictionGuard
from app.modules.reservations.approval_service import ApprovalService
from app.modules.reservations.noshow_job import mark_noshows
from app.modules.reservations.checkin_service import CheckinService
from app.modules.reservations.composite_service import CompositeService
from app.modules.reservations.repository import ReservationRepository
from app.modules.reservations.schemas import (
    AvailabilityResponse,
    CompositeReservationCreate,
    CompositeReservationRead,
    ReservationCancel,
    ReservationCreate,
    ReservationDecision,
    ReservationRead,
    ReservationUpdate,
)
from app.modules.environments.models import Environment
from app.modules.qualifications.models import UserQualification
from app.modules.reservations.service import ReservationService
from app.modules.users.models import User
from app.shared.enums import ReservationStatus, UserRole

router = APIRouter(prefix="/api/v1/reservas", tags=["reservations"])


def get_reservation_service(db: Session = Depends(get_db)) -> ReservationService:
    return ReservationService(
        repository=ReservationRepository(db=db),
        audit=build_audit_service(db),
        restriction=RestrictionGuard(repository=PenaltyRepository(db=db)),
        notifications=build_notification_service(db),
    )


def get_approval_service(db: Session = Depends(get_db)) -> ApprovalService:
    return ApprovalService(
        repository=ReservationRepository(db=db),
        audit=build_audit_service(db),
        notifications=build_notification_service(db),
    )


def get_checkin_service(db: Session = Depends(get_db)) -> CheckinService:
    return CheckinService(
        repository=ReservationRepository(db=db),
        audit=build_audit_service(db),
    )


def get_composite_service(db: Session = Depends(get_db)) -> CompositeService:
    return CompositeService(
        repository=ReservationRepository(db=db),
        audit=build_audit_service(db),
        restriction=RestrictionGuard(repository=PenaltyRepository(db=db)),
    )


@router.get("", response_model=list[ReservationRead])
def list_reservations(
    skip: int = 0,
    limit: int = 100,
    environment_id: int | None = None,
    requester_id: int | None = None,
    status_filter: ReservationStatus | None = None,
    start_after: datetime | None = None,
    end_before: datetime | None = None,
    service: ReservationService = Depends(get_reservation_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list_reservations(
        skip=skip,
        limit=limit,
        environment_id=environment_id,
        requester_id=requester_id,
        status=status_filter,
        start_after=start_after,
        end_before=end_before,
    )


@router.get("/disponibilidade", response_model=AvailabilityResponse)
def check_availability(
    environment_id: int,
    start: datetime,
    end: datetime,
    participant_count: int = 1,
    service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.check_availability(
        environment_id=environment_id,
        start=start,
        end=end,
        participant_count=participant_count,
        resource_ids=[],
        current_user=current_user,
    )


@router.get("/{reservation_id}", response_model=ReservationRead)
def get_reservation(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    _: User = Depends(get_current_user),
) -> Any:
    reservation = service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada",
        )
    return reservation


@router.get("/{reservation_id}/qualificacoes-solicitante")
def requester_qualification_status(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> dict:
    reservation = service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada"
        )
    environment = db.get(Environment, reservation.environment_id)
    required = [r.qualification_id for r in environment.requirements]
    now = datetime.now(UTC)
    held = list(
        db.execute(
            select(UserQualification.qualification_id).where(
                UserQualification.user_id == reservation.requester_id,
                UserQualification.valid_until >= now,
            )
        )
        .scalars()
        .all()
    )
    missing = sorted(set(required) - set(held))
    return {
        "required": sorted(required),
        "held": sorted(held),
        "missing": missing,
        "meets_all": not missing,
    }


@router.post("", response_model=ReservationRead, status_code=status.HTTP_201_CREATED)
def create_reservation(
    payload: ReservationCreate,
    service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.create_reservation(payload, current_user)


@router.put("/{reservation_id}", response_model=ReservationRead)
def update_reservation(
    reservation_id: int,
    payload: ReservationUpdate,
    service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    reservation = service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada",
        )
    return service.update_reservation(reservation, payload, current_user)


@router.post("/{reservation_id}/cancelar", response_model=ReservationRead)
def cancel_reservation(
    reservation_id: int,
    payload: ReservationCancel,
    service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    reservation = service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada",
        )
    return service.cancel_reservation(reservation, payload.reason, current_user)


@router.get("/pendentes/lista", response_model=list[ReservationRead])
def list_pending(
    skip: int = 0,
    limit: int = 100,
    service: ApprovalService = Depends(get_approval_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> list[Any]:
    return service.list_pending(skip=skip, limit=limit)


@router.post("/{reservation_id}/aprovar", response_model=ReservationRead)
def approve_reservation(
    reservation_id: int,
    payload: ReservationDecision,
    service: ApprovalService = Depends(get_approval_service),
    res_service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    reservation = res_service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada",
        )
    return service.approve(reservation, current_user, payload.comments)


@router.post("/{reservation_id}/rejeitar", response_model=ReservationRead)
def reject_reservation(
    reservation_id: int,
    payload: ReservationDecision,
    service: ApprovalService = Depends(get_approval_service),
    res_service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    reservation = res_service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada",
        )
    if not payload.comments or not payload.comments.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Motivo obrigatório para rejeição",
        )
    return service.reject(reservation, current_user, payload.comments)


@router.post("/{reservation_id}/checkin", response_model=ReservationRead)
def checkin_reservation(
    reservation_id: int,
    service: CheckinService = Depends(get_checkin_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    reservation = service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada",
        )
    return service.checkin(reservation, current_user)


@router.post("/{reservation_id}/checkout", response_model=ReservationRead)
def checkout_reservation(
    reservation_id: int,
    service: CheckinService = Depends(get_checkin_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    reservation = service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada",
        )
    return service.checkout(reservation, current_user)


@router.post("/jobs/no-show", response_model=dict)
def run_noshow_job(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> dict:
    return {"updated_ids": mark_noshows(db)}


@router.post(
    "/compostas",
    response_model=CompositeReservationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_composite(
    payload: CompositeReservationCreate,
    service: CompositeService = Depends(get_composite_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.create(payload, current_user)


@router.get("/compostas/{composite_id}", response_model=CompositeReservationRead)
def get_composite(
    composite_id: int,
    service: CompositeService = Depends(get_composite_service),
    _: User = Depends(get_current_user),
) -> Any:
    composite = service.get(composite_id)
    if composite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva composta não encontrada",
        )
    return composite


@router.post(
    "/compostas/{composite_id}/itens/{reservation_id}/cancelar",
    response_model=CompositeReservationRead,
)
def cancel_composite_item(
    composite_id: int,
    reservation_id: int,
    payload: ReservationCancel,
    service: CompositeService = Depends(get_composite_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.cancel_item(
        composite_id, reservation_id, payload.reason, current_user
    )
