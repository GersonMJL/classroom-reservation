from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.resources.models import Recurso
from app.modules.resources.schemas import ResourceCreate, ResourceUpdate


class ResourceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self, *, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[Recurso]:
        query = select(Recurso)
        if active_only:
            query = query.where(Recurso.ativo.is_(True))
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, resource_id: int) -> Recurso | None:
        return self.db.get(Recurso, resource_id)

    def create(self, payload: ResourceCreate) -> Recurso:
        recurso = Recurso(**payload.model_dump())
        self.db.add(recurso)
        self.db.commit()
        self.db.refresh(recurso)
        return recurso

    def update(self, recurso: Recurso, payload: ResourceUpdate) -> Recurso:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(recurso, field, value)
        self.db.add(recurso)
        self.db.commit()
        self.db.refresh(recurso)
        return recurso

    def delete(self, recurso: Recurso) -> None:
        self.db.delete(recurso)
        self.db.commit()
