from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.jwt_bearer import get_current_user, get_current_user_with_roles
from repositories.resource_repository import ResourceRepository
from schemas.resource import Resource, ResourceCreate, ResourceUpdate

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post("", response_model=Resource, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource_in: ResourceCreate,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    existing = ResourceRepository.get_by_code(db, resource_in.resource_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um recurso com código '{resource_in.resource_code}'",
        )

    return ResourceRepository.create_resource(db, resource_in)


@router.get("", response_model=list[Resource])
async def list_resources(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
):
    return ResourceRepository.list_resources(
        db, skip=skip, limit=limit, active_only=active_only
    )


@router.get("/{resource_id}", response_model=Resource)
async def get_resource(
    resource_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = ResourceRepository.get_by_id(db, resource_id)
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso não encontrado",
        )
    return resource


@router.put("/{resource_id}", response_model=Resource)
async def update_resource(
    resource_id: int,
    resource_update: ResourceUpdate,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    updated = ResourceRepository.update_resource(db, resource_id, resource_update)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso não encontrado",
        )
    return updated


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    deleted = ResourceRepository.delete_resource(db, resource_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso não encontrado",
        )
