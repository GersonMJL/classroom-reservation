from app.modules.locations.models import Location
from app.modules.locations.repository import LocationRepository
from app.modules.locations.schemas import LocationCreate, LocationUpdate


class LocationService:
    def __init__(self, repository: LocationRepository) -> None:
        self.repository = repository

    def list_locations(self, *, skip: int = 0, limit: int = 100) -> list[Location]:
        return self.repository.list(skip=skip, limit=limit)

    def get_location(self, location_id: int) -> Location | None:
        return self.repository.get_by_id(location_id)

    def create_location(self, payload: LocationCreate) -> Location:
        return self.repository.create(payload)

    def update_location(
        self, location_id: int, payload: LocationUpdate
    ) -> Location | None:
        return self.repository.update(location_id, payload)

    def delete_location(self, location_id: int) -> bool:
        return self.repository.delete(location_id)
