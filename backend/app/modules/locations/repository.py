from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.locations.models import Location
from app.modules.locations.schemas import LocationCreate, LocationUpdate


class LocationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[Location]:
        query = select(Location)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, location_id: int) -> Location | None:
        return self.db.get(Location, location_id)

    def create(self, payload: LocationCreate) -> Location:
        location = Location(**payload.model_dump())
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location

    def update(self, location_id: int, payload: LocationUpdate) -> Location | None:
        location = self.db.get(Location, location_id)
        if location is None:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(location, field, value)
        self.db.commit()
        self.db.refresh(location)
        return location

    def delete(self, location_id: int) -> bool:
        location = self.db.get(Location, location_id)
        if location is None:
            return False
        self.db.delete(location)
        self.db.commit()
        return True
