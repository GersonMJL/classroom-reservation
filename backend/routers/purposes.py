from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.jwt_bearer import get_current_user, get_current_user_with_roles
from repositories.purpose_repository import PurposeRepository
from schemas.purpose import Purpose, PurposeCreate, PurposeUpdate

router = APIRouter(prefix="/purposes", tags=["purposes"])


@router.get("", response_model=list[Purpose])
async def list_purposes(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
):
    return PurposeRepository.list_purposes(
        db, skip=skip, limit=limit, active_only=active_only
    )


@router.post("", response_model=Purpose, status_code=status.HTTP_201_CREATED)
async def create_purpose(
    purpose_in: PurposeCreate,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    normalized_name = purpose_in.name.strip()
    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome da finalidade não pode estar vazio",
        )

    existing = PurposeRepository.get_by_name(db, normalized_name)
    if existing:
        return existing

    return PurposeRepository.create_purpose(db, normalized_name)


@router.get("/{purpose_id}", response_model=Purpose)
async def get_purpose(
    purpose_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    purpose = PurposeRepository.get_by_id(db, purpose_id)
    if purpose is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finalidade não encontrada",
        )
    return purpose


@router.put("/{purpose_id}", response_model=Purpose)
async def update_purpose(
    purpose_id: int,
    purpose_update: PurposeUpdate,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    if purpose_update.name is not None:
        normalized_name = purpose_update.name.strip()
        if not normalized_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O nome da finalidade não pode estar vazio",
            )

        existing = PurposeRepository.get_by_name(db, normalized_name)
        if existing is not None and existing.id != purpose_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe uma finalidade com nome '{normalized_name}'",
            )

        purpose_update.name = normalized_name

    updated = PurposeRepository.update_purpose(db, purpose_id, purpose_update)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finalidade não encontrada",
        )
    return updated


@router.delete("/{purpose_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purpose(
    purpose_id: int,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    deleted = PurposeRepository.delete_purpose(db, purpose_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finalidade não encontrada",
        )
