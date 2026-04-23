from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.environments.repository import EnvironmentRepository
from app.modules.environments.schemas import (
    EnvironmentCreate,
    EnvironmentRead,
    EnvironmentUpdate,
)
from app.modules.environments.service import EnvironmentService
from app.modules.users.models import Usuario

router = APIRouter(prefix="/api/v1/ambientes", tags=["ambientes"])


def get_environment_service(db: Session = Depends(get_db)) -> EnvironmentService:
    return EnvironmentService(repository=EnvironmentRepository(db=db))


@router.get("", response_model=list[EnvironmentRead])
def list_environments(
    skip: int = 0,
    limit: int = 100,
    service: EnvironmentService = Depends(get_environment_service),
    _: Usuario = Depends(get_current_user),
) -> list[Any]:
    return service.list_environments(skip=skip, limit=limit)


@router.get("/{environment_id}", response_model=EnvironmentRead)
def get_environment(
    environment_id: int,
    service: EnvironmentService = Depends(get_environment_service),
    _: Usuario = Depends(get_current_user),
) -> Any:
    ambiente = service.get_environment(environment_id)
    if ambiente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ambiente não encontrado"
        )
    return ambiente


@router.post("", response_model=EnvironmentRead, status_code=status.HTTP_201_CREATED)
def create_environment(
    payload: EnvironmentCreate,
    service: EnvironmentService = Depends(get_environment_service),
    _: Usuario = Depends(get_current_user),
) -> Any:
    return service.create_environment(payload)


@router.put("/{environment_id}", response_model=EnvironmentRead)
def update_environment(
    environment_id: int,
    payload: EnvironmentUpdate,
    service: EnvironmentService = Depends(get_environment_service),
    _: Usuario = Depends(get_current_user),
) -> Any:
    ambiente = service.get_environment(environment_id)
    if ambiente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ambiente não encontrado"
        )
    return service.update_environment(ambiente, payload)


@router.delete("/{environment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_environment(
    environment_id: int,
    service: EnvironmentService = Depends(get_environment_service),
    _: Usuario = Depends(get_current_user),
) -> None:
    ambiente = service.get_environment(environment_id)
    if ambiente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ambiente não encontrado"
        )
    service.delete_environment(ambiente)
