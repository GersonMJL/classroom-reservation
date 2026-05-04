from app.core.security import hash_password
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def _set_roles(self, user: User) -> None:
        setattr(
            user,
            "roles",
            [ur.role.name for ur in user.user_roles if ur.role is not None],
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
        return user

    def update_user(self, user: User, payload: UserUpdate) -> User:
        updated = self.repository.update(user, payload)
        self._set_roles(updated)
        return updated

    def delete_user(self, user: User) -> None:
        self.repository.delete(user)
