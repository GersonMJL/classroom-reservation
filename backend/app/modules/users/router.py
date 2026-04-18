from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.users.models import Usuario
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserRead, UserUpdate
from app.modules.users.service import UserService

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(repository=UserRepository(db=db))


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate, service: UserService = Depends(get_user_service)
) -> Any:
    return service.create_user(payload)


@router.get("", response_model=list[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 100,
    service: UserService = Depends(get_user_service),
    _: Usuario = Depends(get_current_user),
) -> list[Any]:
    return service.list_users(skip=skip, limit=limit)


@router.get("/me", response_model=UserRead)
def get_me(current_user: Usuario = Depends(get_current_user)) -> Any:
    setattr(
        current_user,
        "papeis",
        [
            up.papel.nome
            for up in current_user.usuario_papeis
            if up.papel is not None
        ],
    )
    return current_user


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    service: UserService = Depends(get_user_service),
    _: Usuario = Depends(get_current_user),
) -> Any:
    usuario = service.get_user(user_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )
    return service.update_user(usuario, payload)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: Usuario = Depends(get_current_user),
) -> None:
    usuario = service.get_user(user_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )
    service.delete_user(usuario)
