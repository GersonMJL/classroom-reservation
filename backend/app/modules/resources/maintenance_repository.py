from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.resources.models import ResourceMaintenance


class ResourceMaintenanceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, resource_id: int | None = None) -> list[ResourceMaintenance]:
        query = select(ResourceMaintenance).order_by(ResourceMaintenance.start_date)
        if resource_id is not None:
            query = query.where(ResourceMaintenance.resource_id == resource_id)
        return list(self.db.execute(query).scalars().all())

    def get_by_id(self, id: int) -> ResourceMaintenance | None:
        return self.db.get(ResourceMaintenance, id)

    def add(self, item: ResourceMaintenance) -> ResourceMaintenance:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: ResourceMaintenance) -> None:
        self.db.delete(item)
        self.db.commit()

    def overlapping(
        self, *, resource_ids: list[int], start: datetime, end: datetime
    ) -> list[ResourceMaintenance]:
        if not resource_ids:
            return []
        query = (
            select(ResourceMaintenance)
            .where(ResourceMaintenance.resource_id.in_(resource_ids))
            .where(ResourceMaintenance.start_date < end)
            .where(ResourceMaintenance.end_date > start)
        )
        return list(self.db.execute(query).scalars().all())
