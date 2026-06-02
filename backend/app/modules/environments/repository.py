from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.environments.models import Environment, EnvironmentRequirement
from app.modules.environments.schemas import EnvironmentCreate, EnvironmentUpdate
from app.modules.reservations.models import Reservation
from app.modules.reservations.state_machine import BLOCKING_STATUSES


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

    def update(self, environment: Environment, payload: EnvironmentUpdate) -> Environment:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(environment, field, value)
        self.db.add(environment)
        self.db.commit()
        self.db.refresh(environment)
        return environment

    def delete(self, environment: Environment) -> None:
        self.db.delete(environment)
        self.db.commit()

    def get_by_code(self, code: str) -> Environment | None:
        return (
            self.db.execute(select(Environment).where(Environment.code == code))
            .scalars()
            .first()
        )

    def max_active_participants(self, environment_id: int) -> int:
        result = self.db.execute(
            select(func.max(Reservation.participant_count))
            .where(Reservation.environment_id == environment_id)
            .where(Reservation.status.in_(list(BLOCKING_STATUSES)))
        ).scalar_one_or_none()
        return int(result or 0)

    # --- Requirement methods ---

    def list_requirements(self, environment_id: int) -> list[EnvironmentRequirement]:
        query = select(EnvironmentRequirement).where(
            EnvironmentRequirement.environment_id == environment_id
        )
        return list(self.db.execute(query).scalars().all())

    def get_requirement(self, requirement_id: int) -> EnvironmentRequirement | None:
        return self.db.get(EnvironmentRequirement, requirement_id)

    def requirement_exists(self, environment_id: int, qualification_id: int) -> bool:
        result = self.db.execute(
            select(EnvironmentRequirement).where(
                EnvironmentRequirement.environment_id == environment_id,
                EnvironmentRequirement.qualification_id == qualification_id,
            )
        ).scalars().first()
        return result is not None

    def add_requirement(
        self, environment_id: int, qualification_id: int
    ) -> EnvironmentRequirement:
        req = EnvironmentRequirement(
            environment_id=environment_id,
            qualification_id=qualification_id,
        )
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)
        return req

    def remove_requirement(self, requirement: EnvironmentRequirement) -> None:
        self.db.delete(requirement)
        self.db.commit()
