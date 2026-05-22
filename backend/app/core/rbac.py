# backend/app/core/rbac.py
from collections.abc import Callable
from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user
from app.modules.users.models import User
from app.shared.enums import UserRole


def require_roles(*allowed: UserRole) -> Callable[..., User]:
    """Dependency factory: exige que o usuário possua pelo menos um dos papéis."""
    allowed_codes = {role.value for role in allowed}

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        user_codes = {
            ur.role.code.upper()
            for ur in current_user.user_roles
            if ur.role is not None
        }
        if not (user_codes & allowed_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: papel insuficiente",
            )
        return current_user

    return _checker
