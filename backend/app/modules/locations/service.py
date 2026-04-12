from app.modules.locations.models import Location
from app.modules.locations.repository import LocationRepository


class LocationService:
    def __init__(self, repository: LocationRepository) -> None:
        self.repository = repository

    def list_locations(self, *, skip: int = 0, limit: int = 100) -> list[Location]:
        return self.repository.list(skip=skip, limit=limit)

    def get_location(self, location_id: int) -> Location | None:
        return self.repository.get_by_id(location_id)
