from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.locations.models import Location


class LocationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[Location]:
        query = select(Location)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, location_id: int) -> Location | None:
        return self.db.get(Location, location_id)
