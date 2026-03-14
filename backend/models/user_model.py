from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from models.mixins import TimestampMixin


class UserModel(TimestampMixin, Base):
    """SQLAlchemy ORM model for User table."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    roles: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    supervised_rooms: Mapped[list["RoomModel"]] = relationship(
        "RoomModel", back_populates="supervisor"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, full_name={self.full_name})>"


if TYPE_CHECKING:
    from models.room_model import RoomModel
