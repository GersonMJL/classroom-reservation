from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.resources.repository import ResourceRepository
from app.modules.resources.schemas import ResourceCreate, ResourceRead, ResourceUpdate
from app.modules.resources.service import ResourceService
from app.modules.users.models import User

router = APIRouter()


def get_resource_service(db: Session = Depends(get_db)) -> ResourceService:
    return ResourceService(repository=ResourceRepository(db=db))


@router.get("", response_model=list[ResourceRead])
def list_resources(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    service: ResourceService = Depends(get_resource_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list_resources(skip=skip, limit=limit, active_only=active_only)


@router.get("/{resource_id}", response_model=ResourceRead)
def get_resource(
    resource_id: int,
    service: ResourceService = Depends(get_resource_service),
    _: User = Depends(get_current_user),
) -> Any:
    resource = service.get_resource(resource_id)
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recurso não encontrado"
        )
    return resource


@router.post("", response_model=ResourceRead, status_code=status.HTTP_201_CREATED)
def create_resource(
    payload: ResourceCreate,
    service: ResourceService = Depends(get_resource_service),
    _: User = Depends(get_current_user),
) -> Any:
    return service.create_resource(payload)


@router.put("/{resource_id}", response_model=ResourceRead)
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    service: ResourceService = Depends(get_resource_service),
    _: User = Depends(get_current_user),
) -> Any:
    resource = service.get_resource(resource_id)
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recurso não encontrado"
        )
    return service.update_resource(resource, payload)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    service: ResourceService = Depends(get_resource_service),
    _: User = Depends(get_current_user),
) -> None:
    resource = service.get_resource(resource_id)
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recurso não encontrado"
        )
    service.delete_resource(resource)
