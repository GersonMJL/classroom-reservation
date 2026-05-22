from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditRecord
from app.shared.enums import AuditAction


class AuditRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        entity_type: str | None = None,
        target_id: int | None = None,
        action: AuditAction | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[AuditRecord]:
        query = select(AuditRecord)
        if entity_type:
            query = query.where(AuditRecord.entity_type == entity_type)
        if target_id is not None:
            query = query.where(AuditRecord.target_id == target_id)
        if action is not None:
            query = query.where(AuditRecord.action == action)
        if start is not None:
            query = query.where(AuditRecord.performed_at >= start)
        if end is not None:
            query = query.where(AuditRecord.performed_at <= end)
        query = (
            query.order_by(AuditRecord.performed_at.desc()).offset(skip).limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def add(self, record: AuditRecord) -> AuditRecord:
        self.db.add(record)
        self.db.flush()
        return record
