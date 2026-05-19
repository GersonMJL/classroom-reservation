from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.qualifications.models import Qualification, UserQualification
from app.modules.qualifications.schemas import (
    QualificationCreate,
    QualificationUpdate,
    UserQualificationCreate,
)


class QualificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[Qualification]:
        query = select(Qualification)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, qualification_id: int) -> Qualification | None:
        return self.db.get(Qualification, qualification_id)

    def create(self, payload: QualificationCreate) -> Qualification:
        qualification = Qualification(**payload.model_dump())
        self.db.add(qualification)
        self.db.commit()
        self.db.refresh(qualification)
        return qualification

    def update(
        self, qualification_id: int, payload: QualificationUpdate
    ) -> Qualification | None:
        qualification = self.db.get(Qualification, qualification_id)
        if qualification is None:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(qualification, field, value)
        self.db.commit()
        self.db.refresh(qualification)
        return qualification

    def delete(self, qualification_id: int) -> bool:
        qualification = self.db.get(Qualification, qualification_id)
        if qualification is None:
            return False
        self.db.delete(qualification)
        self.db.commit()
        return True


class UserQualificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_user(self, user_id: int) -> list[UserQualification]:
        query = select(UserQualification).where(UserQualification.user_id == user_id)
        return list(self.db.execute(query).scalars().all())

    def get_by_id(self, user_qualification_id: int) -> UserQualification | None:
        return self.db.get(UserQualification, user_qualification_id)

    def create(self, payload: UserQualificationCreate) -> UserQualification:
        uq = UserQualification(**payload.model_dump())
        self.db.add(uq)
        self.db.commit()
        self.db.refresh(uq)
        return uq

    def delete(self, user_qualification_id: int) -> bool:
        uq = self.db.get(UserQualification, user_qualification_id)
        if uq is None:
            return False
        self.db.delete(uq)
        self.db.commit()
        return True
