from app.modules.audit.audit_service import AuditService
from app.modules.audit.snapshot import snapshot
from app.modules.locations.models import Location
from app.modules.locations.repository import LocationRepository
from app.modules.locations.schemas import LocationCreate, LocationRead, LocationUpdate
from app.shared.enums import AuditAction

_ENTITY_TYPE = "location"


class LocationService:
    def __init__(self, repository: LocationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list_locations(self, *, skip: int = 0, limit: int = 100) -> list[Location]:
        return self.repository.list(skip=skip, limit=limit)

    def get_location(self, location_id: int) -> Location | None:
        return self.repository.get_by_id(location_id)

    def create_location(
        self, payload: LocationCreate, *, performed_by: int
    ) -> Location:
        location = self.repository.create(payload)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=location.id,
            action=AuditAction.CREATE,
            performed_by=performed_by,
            after=snapshot(location, LocationRead),
        )
        return location

    def update_location(
        self, location_id: int, payload: LocationUpdate, *, performed_by: int
    ) -> Location | None:
        existing = self.repository.get_by_id(location_id)
        if existing is None:
            return None
        before = snapshot(existing, LocationRead)
        updated = self.repository.update(location_id, payload)
        if updated is None:
            return None
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=updated.id,
            action=AuditAction.UPDATE,
            performed_by=performed_by,
            before=before,
            after=snapshot(updated, LocationRead),
        )
        return updated

    def delete_location(self, location_id: int, *, performed_by: int) -> bool:
        existing = self.repository.get_by_id(location_id)
        if existing is None:
            return False
        before = snapshot(existing, LocationRead)
        deleted = self.repository.delete(location_id)
        if deleted:
            self.audit.record(
                entity_type=_ENTITY_TYPE,
                target_id=location_id,
                action=AuditAction.DELETE,
                performed_by=performed_by,
                before=before,
            )
        return deleted
