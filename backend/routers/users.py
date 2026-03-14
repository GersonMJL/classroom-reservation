from typing import List

from core.jwt_bearer import get_current_user, get_current_user_with_roles
from core.database import get_db
from core.utils import get_password_hash
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.user import User, UserCreate, UserBase, UserRolesUpdate
from repositories.user_repository import UserRepository

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new user
    """
    # Check if user already exists
    existing_user = UserRepository.get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado"
        )

    # Hash password and create user
    hashed_password = get_password_hash(user_in.password)
    db_user = UserRepository.create_user(db, user_in, hashed_password)

    return db_user


@router.get("/me", response_model=User)
async def read_users_me(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current authenticated user
    """
    user = UserRepository.get_user_by_email(db, current_user)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )
    return user


@router.get("/", response_model=List[User])
async def read_all_users(
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all users - admin only
    """
    users = UserRepository.get_all_users(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user by ID - can view own profile or admin can view any
    """
    user = UserRepository.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )
    return user


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_update: UserBase,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user - users can only update their own profile
    """
    # Get current user from database
    current_user_obj = UserRepository.get_user_by_email(db, current_user)
    if not current_user_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário atual não encontrado"
        )

    # Check authorization - user can only update their own profile
    if current_user_obj.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem autorização para atualizar este usuário",
        )

    # Prepare update data
    update_data = user_update.dict(exclude_unset=True)

    # Update user
    updated_user = UserRepository.update_user(db, user_id, update_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )

    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    """
    Delete user - admin only
    """
    success = UserRepository.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )
    return None


@router.put("/{user_id}/roles", response_model=User)
async def update_user_roles(
    user_id: int,
    roles_update: UserRolesUpdate,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    user = UserRepository.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    updated_user = UserRepository.update_user(db, user_id, {"roles": roles_update.roles})
    return updated_user
