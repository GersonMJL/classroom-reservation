from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.resources.availability_repository import ResourceAvailabilityRepository
from app.modules.resources.models import ResourceAvailability
from app.modules.resources.schemas import (
    ResourceAvailabilityCreate,
    ResourceAvailabilityRead,
)
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(
    prefix="/api/v1/resources/disponibilidades", tags=["resource-availability"]
)


def get_repo(db: Session = Depends(get_db)) -> ResourceAvailabilityRepository:
    return ResourceAvailabilityRepository(db=db)


@router.get("", response_model=list[ResourceAvailabilityRead])
def list_availability(
    resource_id: int | None = None,
    repo: ResourceAvailabilityRepository = Depends(get_repo),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return repo.list(resource_id=resource_id)


@router.post(
    "", response_model=ResourceAvailabilityRead, status_code=status.HTTP_201_CREATED
)
def create_availability(
    payload: ResourceAvailabilityCreate,
    repo: ResourceAvailabilityRepository = Depends(get_repo),
    _: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
    ),
) -> Any:
    return repo.add(ResourceAvailability(**payload.model_dump()))


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    item_id: int,
    repo: ResourceAvailabilityRepository = Depends(get_repo),
    _: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
    ),
) -> None:
    item = repo.get_by_id(item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disponibilidade não encontrada",
        )
    repo.delete(item)
