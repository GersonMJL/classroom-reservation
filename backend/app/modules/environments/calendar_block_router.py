from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import build_audit_service
from app.modules.environments.calendar_block_repository import CalendarBlockRepository
from app.modules.environments.calendar_block_service import CalendarBlockService
from app.modules.environments.schemas import (
    BufferReleaseRequest,
    CalendarBlockCreate,
    CalendarBlockRead,
    CalendarBlockUpdate,
)
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/api/v1/calendar-blocks", tags=["calendar-blocks"])


def get_service(db: Session = Depends(get_db)) -> CalendarBlockService:
    return CalendarBlockService(
        repository=CalendarBlockRepository(db=db),
        audit=build_audit_service(db),
    )


@router.get("", response_model=list[CalendarBlockRead])
def list_blocks(
    skip: int = 0,
    limit: int = 100,
    environment_id: int | None = None,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.TECHNICIAN,
            UserRole.REQUESTER,
        )
    ),
) -> list[Any]:
    return service.list(skip=skip, limit=limit, environment_id=environment_id)


@router.post("", response_model=CalendarBlockRead, status_code=status.HTTP_201_CREATED)
def create_block(
    payload: CalendarBlockCreate,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    return service.create(payload)


@router.put("/{block_id}", response_model=CalendarBlockRead)
def update_block(
    block_id: int,
    payload: CalendarBlockUpdate,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    block = service.get(block_id)
    if block is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bloqueio não encontrado"
        )
    return service.update(block, payload)


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(
    block_id: int,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> None:
    block = service.get(block_id)
    if block is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bloqueio não encontrado"
        )
    service.delete(block)


@router.post("/{block_id}/liberar", response_model=CalendarBlockRead)
def release_block_early(
    block_id: int,
    payload: BufferReleaseRequest = Body(default_factory=BufferReleaseRequest),
    service: CalendarBlockService = Depends(get_service),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
    ),
) -> Any:
    block = service.get(block_id)
    if block is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bloqueio não encontrado"
        )
    return service.release_early(
        block, released_by=current_user.id, notes=payload.notes
    )
