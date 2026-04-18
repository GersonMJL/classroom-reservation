from app.modules.resources.models import Recurso
from app.modules.resources.repository import ResourceRepository
from app.modules.resources.schemas import ResourceCreate, ResourceUpdate


class ResourceService:
    def __init__(self, repository: ResourceRepository) -> None:
        self.repository = repository

    def list_resources(
        self, *, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[Recurso]:
        return self.repository.list(skip=skip, limit=limit, active_only=active_only)

    def get_resource(self, resource_id: int) -> Recurso | None:
        return self.repository.get_by_id(resource_id)

    def create_resource(self, payload: ResourceCreate) -> Recurso:
        return self.repository.create(payload)

    def update_resource(self, recurso: Recurso, payload: ResourceUpdate) -> Recurso:
        return self.repository.update(recurso, payload)

    def delete_resource(self, recurso: Recurso) -> None:
        self.repository.delete(recurso)
