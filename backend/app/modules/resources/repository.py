from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.resources.models import Resource
from app.modules.resources.schemas import ResourceCreate, ResourceUpdate


class ResourceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self, *, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[Resource]:
        query = select(Resource)
        if active_only:
            query = query.where(Resource.is_active.is_(True))
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, resource_id: int) -> Resource | None:
        return self.db.get(Resource, resource_id)

    def create(self, payload: ResourceCreate) -> Resource:
        resource = Resource(**payload.model_dump())
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        return resource

    def update(self, resource: Resource, payload: ResourceUpdate) -> Resource:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(resource, field, value)
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        return resource

    def delete(self, resource: Resource) -> None:
        self.db.delete(resource)
        self.db.commit()
