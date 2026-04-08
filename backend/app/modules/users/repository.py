from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.users.models import Role, User, UserRole
from app.modules.users.schemas import UserCreate, UserUpdate


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[User]:
        query = select(User)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def _sync_roles(self, user: User, role_names: list[str]) -> None:
        normalized = sorted({name.strip() for name in role_names if name.strip()})
        if not normalized:
            user.user_roles = []
            return

        existing_roles = list(
            self.db.execute(select(Role).where(Role.name.in_(normalized)))
            .scalars()
            .all()
        )
        existing_by_name = {role.name: role for role in existing_roles}

        missing_names = [name for name in normalized if name not in existing_by_name]
        for name in missing_names:
            role = Role(role_id=name.lower().replace(" ", "_"), name=name)
            self.db.add(role)
            existing_roles.append(role)

        self.db.flush()
        role_by_name = {role.name: role for role in existing_roles}
        user.user_roles = [
            UserRole(user=user, role=role_by_name[name]) for name in normalized
        ]

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        query = select(User).where(User.email == email)
        return self.db.execute(query).scalar_one_or_none()

    def create(self, payload: UserCreate) -> User:
        user = User(
            name=payload.name,
            email=str(payload.email),
            password_hash=payload.password,
            is_active=payload.is_active,
        )
        self.db.add(user)
        self.db.flush()
        self._sync_roles(user, payload.roles)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, payload: UserUpdate) -> User:
        if payload.name is not None:
            user.name = payload.name
        if payload.email is not None:
            user.email = str(payload.email)
        if payload.is_active is not None:
            user.is_active = payload.is_active
        if payload.roles is not None:
            self._sync_roles(user, payload.roles)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()
