from app.core.security import hash_password
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def list_users(self, *, skip: int = 0, limit: int = 100) -> list[User]:
        users = self.repository.list(skip=skip, limit=limit)
        for user in users:
            setattr(
                user,
                "roles",
                [
                    user_role.role.name
                    for user_role in user.user_roles
                    if user_role.role is not None
                ],
            )
        return users

    def get_user(self, user_id: int) -> User | None:
        user = self.repository.get_by_id(user_id)
        if user is None:
            return None
        setattr(
            user,
            "roles",
            [
                user_role.role.name
                for user_role in user.user_roles
                if user_role.role is not None
            ],
        )
        return user

    def create_user(self, payload: UserCreate) -> User:
        payload_with_hashed_password = payload.model_copy(
            update={"password": hash_password(payload.password)}
        )
        user = self.repository.create(payload_with_hashed_password)
        setattr(
            user,
            "roles",
            [
                user_role.role.name
                for user_role in user.user_roles
                if user_role.role is not None
            ],
        )
        return user

    def update_user(self, user: User, payload: UserUpdate) -> User:
        updated = self.repository.update(user, payload)
        setattr(
            updated,
            "roles",
            [
                user_role.role.name
                for user_role in updated.user_roles
                if user_role.role is not None
            ],
        )
        return updated

    def delete_user(self, user: User) -> None:
        self.repository.delete(user)
