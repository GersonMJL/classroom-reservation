from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from models.mixins import TimestampMixin


class ResourceModel(TimestampMixin, Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    resource_code: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    resource_type: Mapped[str] = mapped_column(String, nullable=False)
    availability_notes: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    room_links: Mapped[list["RoomResourceModel"]] = relationship(
        "RoomResourceModel",
        back_populates="resource",
        cascade="all, delete-orphan",
    )


if TYPE_CHECKING:
    from models.room_resource_model import RoomResourceModel
