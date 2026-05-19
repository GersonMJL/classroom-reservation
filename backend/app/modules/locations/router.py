from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.locations.repository import LocationRepository
from app.modules.locations.schemas import LocationCreate, LocationRead, LocationUpdate
from app.modules.locations.service import LocationService
from app.modules.users.models import User

router = APIRouter(prefix="/api/v1/locations", tags=["locations"])


def get_location_service(db: Session = Depends(get_db)) -> LocationService:
    return LocationService(repository=LocationRepository(db=db))


@router.get("", response_model=list[LocationRead])
def list_locations(
    skip: int = 0,
    limit: int = 100,
    service: LocationService = Depends(get_location_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list_locations(skip=skip, limit=limit)


@router.get("/{location_id}", response_model=LocationRead)
def get_location(
    location_id: int,
    service: LocationService = Depends(get_location_service),
    _: User = Depends(get_current_user),
) -> Any:
    location = service.get_location(location_id)
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Localização não encontrada"
        )
    return location


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreate,
    service: LocationService = Depends(get_location_service),
    _: User = Depends(get_current_user),
) -> Any:
    return service.create_location(payload)


@router.put("/{location_id}", response_model=LocationRead)
def update_location(
    location_id: int,
    payload: LocationUpdate,
    service: LocationService = Depends(get_location_service),
    _: User = Depends(get_current_user),
) -> Any:
    location = service.update_location(location_id, payload)
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Localização não encontrada"
        )
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    service: LocationService = Depends(get_location_service),
    _: User = Depends(get_current_user),
) -> None:
    if not service.delete_location(location_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Localização não encontrada"
        )
