from datetime import UTC, datetime

from app.modules.audit.audit_service import AuditService
from app.modules.governance.penalty_service import PenaltyService
from app.modules.operations.incident_repository import IncidentRepository
from app.modules.operations.models import Incident
from app.modules.operations.schemas import IncidentCreate
from app.modules.reservations.models import Reservation
from app.modules.users.models import User
from app.shared.enums import AuditAction, PenaltyType


class IncidentService:
    def __init__(
        self,
        repository: IncidentRepository,
        audit: AuditService,
        penalties: PenaltyService,
    ) -> None:
        self.repository = repository
        self.audit = audit
        self.penalties = penalties

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
        reservation = self.repository.db.get(Reservation, payload.reservation_id)
        if reservation is not None:
            self.penalties.apply_manual(
                user_id=reservation.responsible_id,
                reservation_id=reservation.id,
                type=PenaltyType.DAMAGE,
                description=f"Dano relatado no incidente #{saved.id}",
                duration_days=None,
                applied_by=reporter,
            )
        return saved
