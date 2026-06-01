from app.modules.audit.audit_service import AuditService
from app.modules.audit.snapshot import snapshot
from app.modules.environments.models import Environment
from app.modules.environments.repository import EnvironmentRepository
from app.modules.environments.schemas import (
    EnvironmentCreate,
    EnvironmentRead,
    EnvironmentUpdate,
)
from app.shared.enums import AuditAction

_ENTITY_TYPE = "environment"


class EnvironmentService:
    def __init__(self, repository: EnvironmentRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list_environments(self, *, skip: int = 0, limit: int = 100) -> list[Environment]:
        return self.repository.list(skip=skip, limit=limit)

    def get_environment(self, environment_id: int) -> Environment | None:
        return self.repository.get_by_id(environment_id)

    def create_environment(
        self, payload: EnvironmentCreate, *, performed_by: int
    ) -> Environment:
        env = self.repository.create(payload)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=env.id,
            action=AuditAction.CREATE,
            performed_by=performed_by,
            after=snapshot(env, EnvironmentRead),
        )
        return env

    def update_environment(
        self, environment: Environment, payload: EnvironmentUpdate, *, performed_by: int
    ) -> Environment:
        before = snapshot(environment, EnvironmentRead)
        updated = self.repository.update(environment, payload)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=updated.id,
            action=AuditAction.UPDATE,
            performed_by=performed_by,
            before=before,
            after=snapshot(updated, EnvironmentRead),
        )
        return updated

    def delete_environment(self, environment: Environment, *, performed_by: int) -> None:
        before = snapshot(environment, EnvironmentRead)
        target_id = environment.id
        self.repository.delete(environment)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=target_id,
            action=AuditAction.DELETE,
            performed_by=performed_by,
            before=before,
        )
