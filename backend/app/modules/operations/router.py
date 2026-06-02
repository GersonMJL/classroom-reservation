# backend/app/modules/operations/router.py
from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import build_audit_service
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.governance.penalty_service import PenaltyService
from app.modules.notifications.service import build_notification_service
from app.modules.operations.incident_repository import IncidentRepository
from app.modules.operations.incident_service import IncidentService
from app.modules.operations.schemas import IncidentCreate, IncidentRead
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/api/v1/operations", tags=["operations"])


def get_incident_service(db: Session = Depends(get_db)) -> IncidentService:
    return IncidentService(
        repository=IncidentRepository(db=db),
        audit=build_audit_service(db),
        penalties=PenaltyService(
            repository=PenaltyRepository(db=db),
            audit=build_audit_service(db),
            notifications=build_notification_service(db),
        ),
    )


@router.get("/incidentes", response_model=list[IncidentRead])
def list_incidents(
    skip: int = 0,
    limit: int = 100,
    reservation_id: int | None = None,
    service: IncidentService = Depends(get_incident_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list(skip=skip, limit=limit, reservation_id=reservation_id)


@router.post(
    "/incidentes",
    response_model=IncidentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_incident(
    payload: IncidentCreate,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
    ),
) -> Any:
    return service.create(payload, current_user)
