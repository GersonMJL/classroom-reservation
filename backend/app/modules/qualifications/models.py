from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Qualification(Base):
    __tablename__ = "qualifications"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    user_qualifications = relationship(
        "UserQualification",
        back_populates="qualification",
        cascade="all, delete-orphan",
    )
    environment_requirements = relationship(
        "EnvironmentRequirement", back_populates="qualification"
    )


class UserQualification(Base):
    __tablename__ = "user_qualifications"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    qualification_id: Mapped[int] = mapped_column(
        ForeignKey("qualifications.id"), nullable=False
    )
    valid_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    user = relationship("User", back_populates="qualifications")
    qualification = relationship("Qualification", back_populates="user_qualifications")
