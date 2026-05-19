from app.modules.organizational_units.models import OrganizationalUnit
from app.modules.organizational_units.repository import OrganizationalUnitRepository
from app.modules.organizational_units.schemas import (
    OrganizationalUnitCreate,
    OrganizationalUnitUpdate,
)


class OrganizationalUnitService:
    def __init__(self, repository: OrganizationalUnitRepository) -> None:
        self.repository = repository

    def list_units(
        self, *, skip: int = 0, limit: int = 100
    ) -> list[OrganizationalUnit]:
        return self.repository.list(skip=skip, limit=limit)

    def get_unit(self, unit_id: int) -> OrganizationalUnit | None:
        return self.repository.get_by_id(unit_id)

    def create_unit(self, payload: OrganizationalUnitCreate) -> OrganizationalUnit:
        return self.repository.create(payload)

    def update_unit(
        self, unit_id: int, payload: OrganizationalUnitUpdate
    ) -> OrganizationalUnit | None:
        return self.repository.update(unit_id, payload)

    def delete_unit(self, unit_id: int) -> bool:
        return self.repository.delete(unit_id)
