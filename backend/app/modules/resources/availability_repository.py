from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.resources.models import ResourceAvailability


class ResourceAvailabilityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, resource_id: int | None = None) -> list[ResourceAvailability]:
        query = select(ResourceAvailability).order_by(ResourceAvailability.start)
        if resource_id is not None:
            query = query.where(ResourceAvailability.resource_id == resource_id)
        return list(self.db.execute(query).scalars().all())

    def get_by_id(self, id: int) -> ResourceAvailability | None:
        return self.db.get(ResourceAvailability, id)

    def add(self, item: ResourceAvailability) -> ResourceAvailability:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: ResourceAvailability) -> None:
        self.db.delete(item)
        self.db.commit()
