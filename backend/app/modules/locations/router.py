from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.locations.repository import LocationRepository
from app.modules.locations.schemas import LocationRead
from app.modules.locations.service import LocationService
from app.modules.users.models import User

router = APIRouter()


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
