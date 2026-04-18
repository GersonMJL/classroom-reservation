from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.environments.models import Ambiente
from app.modules.environments.schemas import EnvironmentCreate, EnvironmentUpdate


class EnvironmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[Ambiente]:
        query = select(Ambiente)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, environment_id: int) -> Ambiente | None:
        return self.db.get(Ambiente, environment_id)

    def create(self, payload: EnvironmentCreate) -> Ambiente:
        ambiente = Ambiente(**payload.model_dump())
        self.db.add(ambiente)
        self.db.commit()
        self.db.refresh(ambiente)
        return ambiente

    def update(self, ambiente: Ambiente, payload: EnvironmentUpdate) -> Ambiente:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(ambiente, field, value)
        self.db.add(ambiente)
        self.db.commit()
        self.db.refresh(ambiente)
        return ambiente

    def delete(self, ambiente: Ambiente) -> None:
        self.db.delete(ambiente)
        self.db.commit()
