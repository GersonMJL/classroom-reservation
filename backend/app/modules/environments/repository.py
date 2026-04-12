from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.environments.models import Environment
from app.modules.environments.schemas import EnvironmentCreate, EnvironmentUpdate


class EnvironmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[Environment]:
        query = select(Environment)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, environment_id: int) -> Environment | None:
        return self.db.get(Environment, environment_id)

    def create(self, payload: EnvironmentCreate) -> Environment:
        environment = Environment(**payload.model_dump())
        self.db.add(environment)
        self.db.commit()
        self.db.refresh(environment)
        return environment

    def update(
        self, environment: Environment, payload: EnvironmentUpdate
    ) -> Environment:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(environment, field, value)
        self.db.add(environment)
        self.db.commit()
        self.db.refresh(environment)
        return environment

    def delete(self, environment: Environment) -> None:
        self.db.delete(environment)
        self.db.commit()
