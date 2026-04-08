from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrganizationalUnit(Base):
    __tablename__ = "organizational_units"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)

    users = relationship("User", back_populates="organizational_unit")
