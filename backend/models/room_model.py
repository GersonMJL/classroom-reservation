from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from models.mixins import TimestampMixin


class RoomModel(TimestampMixin, Base):
    """SQLAlchemy ORM model for Room table."""

    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    room_type: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    accessibility: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criticality: Mapped[str] = mapped_column(String, default="common", nullable=False)
    supervisor_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supervisor: Mapped["UserModel | None"] = relationship(
        "UserModel", back_populates="supervised_rooms"
    )
    resource_links: Mapped[list["RoomResourceModel"]] = relationship(
        "RoomResourceModel",
        back_populates="room",
        cascade="all, delete-orphan",
    )
    purpose_links: Mapped[list["RoomPurposeModel"]] = relationship(
        "RoomPurposeModel",
        back_populates="room",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Room(id={self.id}, room_id={self.room_id}, location={self.location})>"


if TYPE_CHECKING:
    from models.room_purpose_model import RoomPurposeModel
    from models.room_resource_model import RoomResourceModel
    from models.user_model import UserModel
