from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.qualifications.repository import (
    QualificationRepository,
    UserQualificationRepository,
)
from app.modules.qualifications.schemas import (
    QualificationCreate,
    QualificationRead,
    QualificationUpdate,
    UserQualificationCreate,
    UserQualificationRead,
)
from app.modules.qualifications.service import QualificationService
from app.modules.users.models import User

router = APIRouter(prefix="/api/v1/qualifications", tags=["qualifications"])


def get_qualification_service(db: Session = Depends(get_db)) -> QualificationService:
    return QualificationService(
        qualification_repo=QualificationRepository(db=db),
        user_qualification_repo=UserQualificationRepository(db=db),
    )


@router.get("", response_model=list[QualificationRead])
def list_qualifications(
    skip: int = 0,
    limit: int = 100,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list_qualifications(skip=skip, limit=limit)


@router.get("/{qualification_id}", response_model=QualificationRead)
def get_qualification(
    qualification_id: int,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> Any:
    qualification = service.get_qualification(qualification_id)
    if qualification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Qualificação não encontrada"
        )
    return qualification


@router.post("", response_model=QualificationRead, status_code=status.HTTP_201_CREATED)
def create_qualification(
    payload: QualificationCreate,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> Any:
    return service.create_qualification(payload)


@router.put("/{qualification_id}", response_model=QualificationRead)
def update_qualification(
    qualification_id: int,
    payload: QualificationUpdate,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> Any:
    qualification = service.update_qualification(qualification_id, payload)
    if qualification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Qualificação não encontrada"
        )
    return qualification


@router.delete("/{qualification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_qualification(
    qualification_id: int,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> None:
    if not service.delete_qualification(qualification_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Qualificação não encontrada"
        )


@router.get("/users/{user_id}", response_model=list[UserQualificationRead])
def list_user_qualifications(
    user_id: int,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list_user_qualifications(user_id)


@router.post(
    "/users", response_model=UserQualificationRead, status_code=status.HTTP_201_CREATED
)
def assign_qualification(
    payload: UserQualificationCreate,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> Any:
    return service.assign_qualification(payload)


@router.delete("/users/{user_qualification_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_qualification(
    user_qualification_id: int,
    service: QualificationService = Depends(get_qualification_service),
    _: User = Depends(get_current_user),
) -> None:
    if not service.remove_user_qualification(user_qualification_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Qualificação de usuário não encontrada",
        )
