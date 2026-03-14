from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from models.mixins import TimestampMixin


class RoomResourceModel(TimestampMixin, Base):
    __tablename__ = "room_resources"
    __table_args__ = (
        UniqueConstraint(
            "room_id",
            "resource_id",
            "is_fixed",
            name="uq_room_resource_fixed",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rooms.id"), nullable=False, index=True
    )
    resource_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("resources.id"), nullable=False, index=True
    )
    is_fixed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    room: Mapped["RoomModel"] = relationship("RoomModel", back_populates="resource_links")
    resource: Mapped["ResourceModel"] = relationship(
        "ResourceModel", back_populates="room_links"
    )


if TYPE_CHECKING:
    from models.resource_model import ResourceModel
    from models.room_model import RoomModel
