from sqlalchemy.orm import Session

from models.room_purpose_model import RoomPurposeModel


class RoomPurposeRepository:
    @staticmethod
    def replace_for_room(db: Session, room_id: int, purpose_ids: list[int]) -> None:
        db.query(RoomPurposeModel).filter(RoomPurposeModel.room_id == room_id).delete()

        for purpose_id in purpose_ids:
            link = RoomPurposeModel()
            link.room_id = room_id
            link.purpose_id = purpose_id
            db.add(link)

        db.flush()
