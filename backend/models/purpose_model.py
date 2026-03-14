from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from models.mixins import TimestampMixin


class PurposeModel(TimestampMixin, Base):
    __tablename__ = "purposes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    room_links: Mapped[list["RoomPurposeModel"]] = relationship(
        "RoomPurposeModel",
        back_populates="purpose",
        cascade="all, delete-orphan",
    )


if TYPE_CHECKING:
    from models.room_purpose_model import RoomPurposeModel
