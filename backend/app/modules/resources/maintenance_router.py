from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import build_audit_service
from app.modules.resources.maintenance_repository import ResourceMaintenanceRepository
from app.modules.resources.maintenance_service import ResourceMaintenanceService
from app.modules.resources.schemas import (
    ResourceMaintenanceCreate,
    ResourceMaintenanceRead,
)
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(
    prefix="/api/v1/resources/manutencoes", tags=["resource-maintenance"]
)


def get_service(db: Session = Depends(get_db)) -> ResourceMaintenanceService:
    return ResourceMaintenanceService(
        repository=ResourceMaintenanceRepository(db=db),
        audit=build_audit_service(db),
    )


@router.get("", response_model=list[ResourceMaintenanceRead])
def list_maintenance(
    resource_id: int | None = None,
    service: ResourceMaintenanceService = Depends(get_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list(resource_id=resource_id)


@router.post(
    "", response_model=ResourceMaintenanceRead, status_code=status.HTTP_201_CREATED
)
def create_maintenance(
    payload: ResourceMaintenanceCreate,
    service: ResourceMaintenanceService = Depends(get_service),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
    ),
) -> Any:
    return service.create(payload, performed_by=current_user.id)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance(
    item_id: int,
    service: ResourceMaintenanceService = Depends(get_service),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
    ),
) -> None:
    item = service.get(item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Manutenção não encontrada"
        )
    service.delete(item, performed_by=current_user.id)
