from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Location(Base):
    __tablename__ = "locations"

    campus: Mapped[str] = mapped_column(String(255), nullable=False)
    building: Mapped[str] = mapped_column(String(255), nullable=False)
    floor: Mapped[str] = mapped_column(String(64), nullable=False)

    environments = relationship("Environment", back_populates="location")
    resources = relationship("Resource", back_populates="current_location")
