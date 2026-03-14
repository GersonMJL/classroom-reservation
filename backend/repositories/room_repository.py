"""
Database repository for Room operations.
This follows the repository pattern for clean data access.
"""

from sqlalchemy.orm import Session
from models.room_model import RoomModel
from schemas.room import RoomCreate, RoomUpdate


class RoomRepository:
    """Handles all database operations for Room model."""

    @staticmethod
    def create_room(db: Session, room: RoomCreate) -> RoomModel:
        """Create a new room in the database."""
        db_room = RoomModel()
        db_room.room_id = room.room_id
        db_room.room_type = room.room_type
        db_room.location = room.location
        db_room.capacity = room.capacity
        db_room.accessibility = room.accessibility
        db_room.criticality = room.criticality
        db_room.supervisor_user_id = room.supervisor_user_id
        db_room.is_active = True
        db.add(db_room)
        db.commit()
        db.refresh(db_room)
        return db_room

    @staticmethod
    def get_room_by_id(db: Session, room_id: int) -> RoomModel | None:
        """Retrieve room by primary key."""
        return db.query(RoomModel).filter(RoomModel.id == room_id).first()

    @staticmethod
    def get_room_by_room_id(db: Session, room_id: str) -> RoomModel | None:
        """Retrieve room by room_id (unique identifier)."""
        return db.query(RoomModel).filter(RoomModel.room_id == room_id).first()

    @staticmethod
    def get_all_rooms(
        db: Session, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[RoomModel]:
        """Retrieve all rooms with pagination."""
        query = db.query(RoomModel)
        if active_only:
            query = query.filter(RoomModel.is_active)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_room(
        db: Session, room_id: int, room_data: RoomUpdate
    ) -> RoomModel | None:
        """Update room information."""
        db_room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
        if db_room:
            update_data = room_data.model_dump(exclude_unset=True)
            excluded_fields = {"allowed_purposes", "fixed_resources", "optional_resources"}
            for key, value in update_data.items():
                if key in excluded_fields:
                    continue
                if value is not None and hasattr(db_room, key):
                    setattr(db_room, key, value)
            db.commit()
            db.refresh(db_room)
        return db_room

    @staticmethod
    def delete_room(db: Session, room_id: int) -> bool:
        """Soft delete a room (mark as inactive)."""
        db_room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
        if db_room:
            db_room.is_active = False
            db.commit()
            return True
        return False

    @staticmethod
    def search_rooms_by_capacity(
        db: Session, min_capacity: int, skip: int = 0, limit: int = 100
    ) -> list[RoomModel]:
        """Search rooms by minimum capacity."""
        return (
            db.query(RoomModel)
            .filter(RoomModel.capacity >= min_capacity)
            .filter(RoomModel.is_active)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def search_rooms_by_location(
        db: Session, location: str, skip: int = 0, limit: int = 100
    ) -> list[RoomModel]:
        """Search rooms by location."""
        return (
            db.query(RoomModel)
            .filter(RoomModel.location.ilike(f"%{location}%"))
            .filter(RoomModel.is_active)
            .offset(skip)
            .limit(limit)
            .all()
        )
