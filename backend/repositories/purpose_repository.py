from sqlalchemy.orm import Session

from models.purpose_model import PurposeModel
from schemas.purpose import PurposeUpdate


class PurposeRepository:
    @staticmethod
    def list_purposes(
        db: Session, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[PurposeModel]:
        query = db.query(PurposeModel)
        if active_only:
            query = query.filter(PurposeModel.is_active)
        return query.order_by(PurposeModel.name.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, purpose_id: int) -> PurposeModel | None:
        return db.query(PurposeModel).filter(PurposeModel.id == purpose_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> PurposeModel | None:
        return db.query(PurposeModel).filter(PurposeModel.name == name).first()

    @staticmethod
    def create_purpose(db: Session, name: str) -> PurposeModel:
        purpose = PurposeModel()
        purpose.name = name
        purpose.is_active = True
        db.add(purpose)
        db.commit()
        db.refresh(purpose)
        return purpose

    @staticmethod
    def get_or_create_by_name(db: Session, name: str) -> PurposeModel:
        purpose = PurposeRepository.get_by_name(db, name)
        if purpose is not None:
            return purpose

        purpose = PurposeModel()
        purpose.name = name
        purpose.is_active = True
        db.add(purpose)
        db.flush()
        return purpose

    @staticmethod
    def update_purpose(
        db: Session, purpose_id: int, purpose_update: PurposeUpdate
    ) -> PurposeModel | None:
        purpose = PurposeRepository.get_by_id(db, purpose_id)
        if purpose is None:
            return None

        update_data = purpose_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(purpose, key, value)

        db.commit()
        db.refresh(purpose)
        return purpose

    @staticmethod
    def delete_purpose(db: Session, purpose_id: int) -> bool:
        purpose = PurposeRepository.get_by_id(db, purpose_id)
        if purpose is None:
            return False

        purpose.is_active = False
        db.commit()
        return True
