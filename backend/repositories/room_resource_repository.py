from sqlalchemy.orm import Session

from models.room_resource_model import RoomResourceModel
from schemas.room import RoomResourceItemCreate


class RoomResourceRepository:
    @staticmethod
    def list_for_room(db: Session, room_id: int) -> list[RoomResourceModel]:
        return (
            db.query(RoomResourceModel)
            .filter(RoomResourceModel.room_id == room_id)
            .all()
        )

    @staticmethod
    def replace_for_room(
        db: Session,
        room_id: int,
        fixed_resources: list[RoomResourceItemCreate],
        optional_resources: list[RoomResourceItemCreate],
    ) -> list[RoomResourceModel]:
        db.query(RoomResourceModel).filter(RoomResourceModel.room_id == room_id).delete()

        for item in fixed_resources:
            link = RoomResourceModel()
            link.room_id = room_id
            link.resource_id = item.resource_id
            link.is_fixed = True
            link.quantity = item.quantity
            db.add(link)

        for item in optional_resources:
            link = RoomResourceModel()
            link.room_id = room_id
            link.resource_id = item.resource_id
            link.is_fixed = False
            link.quantity = item.quantity
            db.add(link)

        db.commit()

        return RoomResourceRepository.list_for_room(db, room_id)
