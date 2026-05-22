# backend/app/modules/operations/incident_service.py
from datetime import UTC, datetime

from app.modules.audit.audit_service import AuditService
from app.modules.operations.incident_repository import IncidentRepository
from app.modules.operations.models import Incident
from app.modules.operations.schemas import IncidentCreate
from app.modules.users.models import User
from app.shared.enums import AuditAction


class IncidentService:
    def __init__(self, repository: IncidentRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list(self, **kwargs) -> list[Incident]:
        return self.repository.list(**kwargs)

    def create(self, payload: IncidentCreate, reporter: User) -> Incident:
        incident = Incident(
            reservation_id=payload.reservation_id,
            description=payload.description,
            severity=payload.severity,
            reported_at=datetime.now(UTC),
        )
        saved = self.repository.add(incident)
        self.audit.record(
            entity_type="incident",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=reporter.id,
            after={
                "reservation_id": saved.reservation_id,
                "severity": saved.severity,
            },
        )
        return saved
