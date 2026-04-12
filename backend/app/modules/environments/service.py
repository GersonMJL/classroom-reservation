from app.modules.environments.models import Environment
from app.modules.environments.repository import EnvironmentRepository
from app.modules.environments.schemas import EnvironmentCreate, EnvironmentUpdate


class EnvironmentService:
    def __init__(self, repository: EnvironmentRepository) -> None:
        self.repository = repository

    def list_environments(self, *, skip: int = 0, limit: int = 100) -> list[Environment]:
        return self.repository.list(skip=skip, limit=limit)

    def get_environment(self, environment_id: int) -> Environment | None:
        return self.repository.get_by_id(environment_id)

    def create_environment(self, payload: EnvironmentCreate) -> Environment:
        return self.repository.create(payload)

    def update_environment(
        self, environment: Environment, payload: EnvironmentUpdate
    ) -> Environment:
        return self.repository.update(environment, payload)

    def delete_environment(self, environment: Environment) -> None:
        self.repository.delete(environment)
