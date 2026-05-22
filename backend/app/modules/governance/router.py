# backend/app/modules/governance/router.py
from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import build_audit_service
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.governance.penalty_service import PenaltyService
from app.modules.governance.schemas import (
    AppealCreate,
    AppealRead,
    AppealResolve,
    PenaltyManualCreate,
    PenaltyRead,
)
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/api/v1/governance", tags=["governance"])


def get_penalty_service(db: Session = Depends(get_db)) -> PenaltyService:
    return PenaltyService(
        repository=PenaltyRepository(db=db),
        audit=build_audit_service(db),
    )


def _is_staff(user: User) -> bool:
    staff_codes = {UserRole.ADMIN.value, UserRole.MANAGER.value}
    return any(
        ur.role and ur.role.code.upper() in staff_codes for ur in user.user_roles
    )


@router.get("/penalidades", response_model=list[PenaltyRead])
def list_penalties(
    skip: int = 0,
    limit: int = 100,
    user_id: int | None = None,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(get_current_user),
) -> list[Any]:
    # Solicitante só vê as próprias penalidades; admin/manager veem tudo.
    if not _is_staff(current_user):
        user_id = current_user.id
    return service.list(skip=skip, limit=limit, user_id=user_id)


@router.post(
    "/penalidades",
    response_model=PenaltyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_penalty(
    payload: PenaltyManualCreate,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    return service.apply_manual(
        user_id=payload.user_id,
        reservation_id=payload.reservation_id,
        type=payload.type,
        description=payload.description,
        duration_days=payload.duration_days,
        applied_by=current_user,
    )


@router.post(
    "/appeals",
    response_model=AppealRead,
    status_code=status.HTTP_201_CREATED,
)
def submit_appeal(
    payload: AppealCreate,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.submit_appeal(
        penalty_id=payload.penalty_id,
        justification=payload.justification,
        by=current_user,
    )


@router.post("/appeals/{appeal_id}/resolver", response_model=AppealRead)
def resolve_appeal(
    appeal_id: int,
    payload: AppealResolve,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    return service.resolve_appeal(
        appeal_id=appeal_id,
        approve=payload.approve,
        resolution_notes=payload.resolution_notes,
        by=current_user,
    )
