from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from models.mixins import TimestampMixin


class RoomPurposeModel(TimestampMixin, Base):
    __tablename__ = "room_purposes"
    __table_args__ = (
        UniqueConstraint("room_id", "purpose_id", name="uq_room_purpose"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rooms.id"), nullable=False, index=True
    )
    purpose_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("purposes.id"), nullable=False, index=True
    )

    room: Mapped["RoomModel"] = relationship("RoomModel", back_populates="purpose_links")
    purpose: Mapped["PurposeModel"] = relationship(
        "PurposeModel", back_populates="room_links"
    )


if TYPE_CHECKING:
    from models.purpose_model import PurposeModel
    from models.room_model import RoomModel
