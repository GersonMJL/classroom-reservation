from app.modules.qualifications.models import Qualification, UserQualification
from app.modules.qualifications.repository import (
    QualificationRepository,
    UserQualificationRepository,
)
from app.modules.qualifications.schemas import (
    QualificationCreate,
    QualificationUpdate,
    UserQualificationCreate,
)


class QualificationService:
    def __init__(
        self,
        qualification_repo: QualificationRepository,
        user_qualification_repo: UserQualificationRepository,
    ) -> None:
        self.qualification_repo = qualification_repo
        self.user_qualification_repo = user_qualification_repo

    def list_qualifications(
        self, *, skip: int = 0, limit: int = 100
    ) -> list[Qualification]:
        return self.qualification_repo.list(skip=skip, limit=limit)

    def get_qualification(self, qualification_id: int) -> Qualification | None:
        return self.qualification_repo.get_by_id(qualification_id)

    def create_qualification(self, payload: QualificationCreate) -> Qualification:
        return self.qualification_repo.create(payload)

    def update_qualification(
        self, qualification_id: int, payload: QualificationUpdate
    ) -> Qualification | None:
        return self.qualification_repo.update(qualification_id, payload)

    def delete_qualification(self, qualification_id: int) -> bool:
        return self.qualification_repo.delete(qualification_id)

    def list_user_qualifications(self, user_id: int) -> list[UserQualification]:
        return self.user_qualification_repo.list_by_user(user_id)

    def assign_qualification(
        self, payload: UserQualificationCreate
    ) -> UserQualification:
        return self.user_qualification_repo.create(payload)

    def remove_user_qualification(self, user_qualification_id: int) -> bool:
        return self.user_qualification_repo.delete(user_qualification_id)
