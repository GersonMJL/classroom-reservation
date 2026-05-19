from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.reservations.repository import ReservationRepository
from app.modules.reservations.schemas import (
    ReservationCancel,
    ReservationCreate,
    ReservationRead,
    ReservationUpdate,
)
from app.modules.reservations.service import ReservationService
from app.modules.users.models import User
from app.shared.enums import ReservationStatus

router = APIRouter(prefix="/api/v1/reservas", tags=["reservations"])


def get_reservation_service(db: Session = Depends(get_db)) -> ReservationService:
    return ReservationService(repository=ReservationRepository(db=db))


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
