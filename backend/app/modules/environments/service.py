from app.modules.environments.models import Ambiente
from app.modules.environments.repository import EnvironmentRepository
from app.modules.environments.schemas import EnvironmentCreate, EnvironmentUpdate


class EnvironmentService:
    def __init__(self, repository: EnvironmentRepository) -> None:
        self.repository = repository

    def list_environments(self, *, skip: int = 0, limit: int = 100) -> list[Ambiente]:
        return self.repository.list(skip=skip, limit=limit)

    def get_environment(self, environment_id: int) -> Ambiente | None:
        return self.repository.get_by_id(environment_id)

    def create_environment(self, payload: EnvironmentCreate) -> Ambiente:
        return self.repository.create(payload)

    def update_environment(self, ambiente: Ambiente, payload: EnvironmentUpdate) -> Ambiente:
        return self.repository.update(ambiente, payload)

    def delete_environment(self, ambiente: Ambiente) -> None:
        self.repository.delete(ambiente)
