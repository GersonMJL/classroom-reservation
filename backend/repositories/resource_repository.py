from sqlalchemy.orm import Session

from models.resource_model import ResourceModel
from schemas.resource import ResourceCreate, ResourceUpdate


class ResourceRepository:
    @staticmethod
    def create_resource(db: Session, resource_in: ResourceCreate) -> ResourceModel:
        db_resource = ResourceModel()
        db_resource.resource_code = resource_in.resource_code
        db_resource.name = resource_in.name
        db_resource.resource_type = resource_in.resource_type
        db_resource.availability_notes = resource_in.availability_notes
        db_resource.is_active = True
        db.add(db_resource)
        db.commit()
        db.refresh(db_resource)
        return db_resource

    @staticmethod
    def get_by_id(db: Session, resource_id: int) -> ResourceModel | None:
        return db.query(ResourceModel).filter(ResourceModel.id == resource_id).first()

    @staticmethod
    def get_by_code(db: Session, resource_code: str) -> ResourceModel | None:
        return (
            db.query(ResourceModel)
            .filter(ResourceModel.resource_code == resource_code)
            .first()
        )

    @staticmethod
    def list_resources(
        db: Session, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[ResourceModel]:
        query = db.query(ResourceModel)
        if active_only:
            query = query.filter(ResourceModel.is_active)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_resource(
        db: Session, resource_id: int, resource_update: ResourceUpdate
    ) -> ResourceModel | None:
        db_resource = db.query(ResourceModel).filter(ResourceModel.id == resource_id).first()
        if db_resource is None:
            return None

        update_data = resource_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_resource, key, value)

        db.commit()
        db.refresh(db_resource)
        return db_resource

    @staticmethod
    def delete_resource(db: Session, resource_id: int) -> bool:
        db_resource = db.query(ResourceModel).filter(ResourceModel.id == resource_id).first()
        if db_resource is None:
            return False
        db_resource.is_active = False
        db.commit()
        return True
