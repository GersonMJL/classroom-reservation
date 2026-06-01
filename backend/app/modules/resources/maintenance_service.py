from app.modules.audit.audit_service import AuditService
from app.modules.resources.maintenance_repository import ResourceMaintenanceRepository
from app.modules.resources.models import ResourceMaintenance
from app.modules.resources.schemas import ResourceMaintenanceCreate
from app.shared.enums import AuditAction


class ResourceMaintenanceService:
    def __init__(
        self, repository: ResourceMaintenanceRepository, audit: AuditService
    ) -> None:
        self.repository = repository
        self.audit = audit

    def list(self, *, resource_id: int | None = None) -> list[ResourceMaintenance]:
        return self.repository.list(resource_id=resource_id)

    def get(self, id: int) -> ResourceMaintenance | None:
        return self.repository.get_by_id(id)

    def create(
        self, payload: ResourceMaintenanceCreate, *, performed_by: int
    ) -> ResourceMaintenance:
        item = ResourceMaintenance(**payload.model_dump())
        saved = self.repository.add(item)
        self.audit.record(
            entity_type="resource_maintenance",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=performed_by,
            after={"resource_id": saved.resource_id, "reason": saved.reason},
        )
        return saved

    def delete(self, item: ResourceMaintenance, *, performed_by: int) -> None:
        target_id = item.id
        resource_id = item.resource_id
        self.repository.delete(item)
        self.audit.record(
            entity_type="resource_maintenance",
            target_id=target_id,
            action=AuditAction.DELETE,
            performed_by=performed_by,
            before={"resource_id": resource_id},
        )
