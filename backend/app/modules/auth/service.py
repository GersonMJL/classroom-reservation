from fastapi import HTTPException, status

from app.core.security import create_access_token, create_refresh_token, verify_password
from app.modules.auth.schemas import TokenResponse
from app.modules.users.repository import UserRepository


class AuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def login(self, username: str, password: str) -> TokenResponse:
        usuario = self.user_repository.get_by_email(username)
        if usuario is None or not usuario.ativo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas"
            )

        if not verify_password(password, usuario.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas"
            )

        papeis = [
            up.papel.nome
            for up in usuario.usuario_papeis
            if up.papel is not None
        ]
        access_token = create_access_token(subject=str(usuario.id), roles=papeis)
        refresh_token = create_refresh_token(subject=str(usuario.id), roles=papeis)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
