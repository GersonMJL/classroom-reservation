from app.core.security import hash_password
from app.modules.audit.audit_service import AuditService
from app.modules.audit.snapshot import snapshot
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserRead, UserUpdate
from app.shared.enums import AuditAction

_ENTITY_TYPE = "user"


class UserService:
    def __init__(self, repository: UserRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def _set_roles(self, user: User) -> None:
        setattr(
            user,
            "roles",
            [ur.role.code.lower() for ur in user.user_roles if ur.role is not None],
        )

    def list_users(self, *, skip: int = 0, limit: int = 100) -> list[User]:
        users = self.repository.list(skip=skip, limit=limit)
        for u in users:
            self._set_roles(u)
        return users

    def get_user(self, user_id: int) -> User | None:
        user = self.repository.get_by_id(user_id)
        if user is None:
            return None
        self._set_roles(user)
        return user

    def create_user(self, payload: UserCreate) -> User:
        payload_hashed = payload.model_copy(
            update={"password": hash_password(payload.password)}
        )
        user = self.repository.create(payload_hashed)
        self._set_roles(user)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=user.id,
            action=AuditAction.CREATE,
            performed_by=user.id,
            after=snapshot(user, UserRead),
        )
        return user

    def update_user(
        self, user: User, payload: UserUpdate, *, performed_by: int
    ) -> User:
        before = snapshot(user, UserRead)
        updated = self.repository.update(user, payload)
        self._set_roles(updated)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=updated.id,
            action=AuditAction.UPDATE,
            performed_by=performed_by,
            before=before,
            after=snapshot(updated, UserRead),
        )
        return updated

    def delete_user(self, user: User, *, performed_by: int) -> None:
        self._set_roles(user)
        before = snapshot(user, UserRead)
        target_id = user.id
        self.repository.delete(user)
        self.audit.record(
            entity_type=_ENTITY_TYPE,
            target_id=target_id,
            action=AuditAction.DELETE,
            performed_by=performed_by,
            before=before,
        )
