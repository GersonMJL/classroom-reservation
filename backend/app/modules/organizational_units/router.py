from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.organizational_units.repository import OrganizationalUnitRepository
from app.modules.organizational_units.schemas import (
    OrganizationalUnitCreate,
    OrganizationalUnitRead,
    OrganizationalUnitUpdate,
)
from app.modules.organizational_units.service import OrganizationalUnitService
from app.modules.users.models import User

router = APIRouter(prefix="/api/v1/organizational-units", tags=["organizational-units"])


def get_organizational_unit_service(
    db: Session = Depends(get_db),
) -> OrganizationalUnitService:
    return OrganizationalUnitService(repository=OrganizationalUnitRepository(db=db))


@router.get("", response_model=list[OrganizationalUnitRead])
def list_units(
    skip: int = 0,
    limit: int = 100,
    service: OrganizationalUnitService = Depends(get_organizational_unit_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list_units(skip=skip, limit=limit)


@router.get("/{unit_id}", response_model=OrganizationalUnitRead)
def get_unit(
    unit_id: int,
    service: OrganizationalUnitService = Depends(get_organizational_unit_service),
    _: User = Depends(get_current_user),
) -> Any:
    unit = service.get_unit(unit_id)
    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade organizacional não encontrada",
        )
    return unit


@router.post(
    "", response_model=OrganizationalUnitRead, status_code=status.HTTP_201_CREATED
)
def create_unit(
    payload: OrganizationalUnitCreate,
    service: OrganizationalUnitService = Depends(get_organizational_unit_service),
    _: User = Depends(get_current_user),
) -> Any:
    return service.create_unit(payload)


@router.put("/{unit_id}", response_model=OrganizationalUnitRead)
def update_unit(
    unit_id: int,
    payload: OrganizationalUnitUpdate,
    service: OrganizationalUnitService = Depends(get_organizational_unit_service),
    _: User = Depends(get_current_user),
) -> Any:
    unit = service.update_unit(unit_id, payload)
    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade organizacional não encontrada",
        )
    return unit


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: int,
    service: OrganizationalUnitService = Depends(get_organizational_unit_service),
    _: User = Depends(get_current_user),
) -> None:
    if not service.delete_unit(unit_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade organizacional não encontrada",
        )
