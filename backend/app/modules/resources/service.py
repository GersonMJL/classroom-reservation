from app.modules.audit.audit_service import AuditService
from app.modules.audit.snapshot import snapshot
from app.modules.resources.models import Resource
from app.modules.resources.repository import ResourceRepository
from app.modules.resources.schemas import ResourceCreate, ResourceRead, ResourceUpdate
from app.shared.enums import AuditAction

_ENTITY_TYPE = "resource"


class ResourceService:
    def __init__(self, repository: ResourceRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list_resources(
        self, *, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[Resource]:
        return self.repository.list(skip=skip, limit=limit, active_only=active_only)

    def get_resource(self, resource_id: int) -> Resource | None:
        return self.repository.get_by_id(resource_id)

    def create_resource(
        self, payload: ResourceCreate, *, performed_by: int
    ) -> Resource:
        resource = self.repository.create(payload)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=resource.id,
            action=AuditAction.CREATE,
            performed_by=performed_by,
            after=snapshot(resource, ResourceRead),
        )
        return resource

    def update_resource(
        self, resource: Resource, payload: ResourceUpdate, *, performed_by: int
    ) -> Resource:
        before = snapshot(resource, ResourceRead)
        updated = self.repository.update(resource, payload)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=updated.id,
            action=AuditAction.UPDATE,
            performed_by=performed_by,
            before=before,
            after=snapshot(updated, ResourceRead),
        )
        return updated

    def delete_resource(self, resource: Resource, *, performed_by: int) -> None:
        before = snapshot(resource, ResourceRead)
        target_id = resource.id
        self.repository.delete(resource)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=target_id,
            action=AuditAction.DELETE,
            performed_by=performed_by,
            before=before,
        )
