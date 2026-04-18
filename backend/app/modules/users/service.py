from app.core.security import hash_password
from app.modules.users.models import Usuario
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def _set_papeis(self, usuario: Usuario) -> None:
        setattr(
            usuario,
            "papeis",
            [up.papel.nome for up in usuario.usuario_papeis if up.papel is not None],
        )

    def list_users(self, *, skip: int = 0, limit: int = 100) -> list[Usuario]:
        usuarios = self.repository.list(skip=skip, limit=limit)
        for u in usuarios:
            self._set_papeis(u)
        return usuarios

    def get_user(self, user_id: int) -> Usuario | None:
        usuario = self.repository.get_by_id(user_id)
        if usuario is None:
            return None
        self._set_papeis(usuario)
        return usuario

    def create_user(self, payload: UserCreate) -> Usuario:
        payload_hashed = payload.model_copy(
            update={"senha": hash_password(payload.senha)}
        )
        usuario = self.repository.create(payload_hashed)
        self._set_papeis(usuario)
        return usuario

    def update_user(self, usuario: Usuario, payload: UserUpdate) -> Usuario:
        updated = self.repository.update(usuario, payload)
        self._set_papeis(updated)
        return updated

    def delete_user(self, usuario: Usuario) -> None:
        self.repository.delete(usuario)
