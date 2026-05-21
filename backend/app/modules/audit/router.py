from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import AuditService, build_audit_service
from app.modules.audit.schemas import AuditRecordRead
from app.modules.users.models import User
from app.shared.enums import AuditAction, UserRole

router = APIRouter(prefix="/api/v1/audit-records", tags=["audit"])


def get_audit_service(db: Session = Depends(get_db)) -> AuditService:
    return build_audit_service(db)


@router.get("", response_model=list[AuditRecordRead])
def list_audit_records(
    skip: int = 0,
    limit: int = 100,
    entity_type: str | None = None,
    target_id: int | None = None,
    action: AuditAction | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    service: AuditService = Depends(get_audit_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> list[Any]:
    return service.list(
        skip=skip,
        limit=limit,
        entity_type=entity_type,
        target_id=target_id,
        action=action,
        start=start,
        end=end,
    )
