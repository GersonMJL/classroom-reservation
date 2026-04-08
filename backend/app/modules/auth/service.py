from fastapi import HTTPException, status

from app.core.security import create_access_token, create_refresh_token, verify_password
from app.modules.auth.schemas import TokenResponse
from app.modules.users.repository import UserRepository


class AuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def login(self, username: str, password: str) -> TokenResponse:
        user = self.user_repository.get_by_email(username)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas"
            )

        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas"
            )

        roles = [
            user_role.role.name
            for user_role in user.user_roles
            if user_role.role is not None
        ]
        access_token = create_access_token(subject=str(user.id), roles=roles)
        refresh_token = create_refresh_token(subject=str(user.id), roles=roles)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
