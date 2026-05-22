import json
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.modules.audit.audit_repository import AuditRepository
from app.modules.audit.models import AuditRecord
from app.shared.enums import AuditAction


class AuditService:
    def __init__(self, repository: AuditRepository) -> None:
        self.repository = repository

    def list(self, **kwargs: Any) -> list[AuditRecord]:
        return self.repository.list(**kwargs)

    def record(
        self,
        *,
        entity_type: str,
        target_id: int,
        action: AuditAction,
        performed_by: int,
        before: dict[str, Any] | None = None,
        after: dict[str, Any] | None = None,
    ) -> AuditRecord:
        record = AuditRecord(
            entity_type=entity_type,
            target_id=target_id,
            action=action,
            performed_by=performed_by,
            performed_at=datetime.now(UTC),
            before_state=json.dumps(before, default=str)[:4000] if before else None,
            after_state=json.dumps(after, default=str)[:4000] if after else None,
        )
        return self.repository.add(record)


def build_audit_service(db: Session) -> AuditService:
    return AuditService(repository=AuditRepository(db=db))
