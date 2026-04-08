from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Environment(Base):
    __tablename__ = "environments"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    criticality: Mapped[str] = mapped_column(String(64), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    operating_hours: Mapped[str] = mapped_column(String(255), nullable=False)
    requires_approval: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    location = relationship("Location", back_populates="environments")
    policies = relationship(
        "EnvironmentPolicy", back_populates="environment", cascade="all, delete-orphan"
    )
    restrictions = relationship(
        "EnvironmentRestriction",
        back_populates="environment",
        cascade="all, delete-orphan",
    )
    resources = relationship(
        "EnvironmentResource",
        back_populates="environment",
        cascade="all, delete-orphan",
    )
    requirements = relationship(
        "EnvironmentRequirement",
        back_populates="environment",
        cascade="all, delete-orphan",
    )
    reservations = relationship("Reservation", back_populates="environment")
    calendar_blocks = relationship(
        "CalendarBlock", back_populates="environment", cascade="all, delete-orphan"
    )


class EnvironmentPolicy(Base):
    __tablename__ = "environment_policies"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    min_lead_time: Mapped[int] = mapped_column(Integer, nullable=False)
    max_lead_time: Mapped[int] = mapped_column(Integer, nullable=False)
    buffer_before: Mapped[int] = mapped_column(Integer, nullable=False)
    buffer_after: Mapped[int] = mapped_column(Integer, nullable=False)
    requires_supervisor: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    environment = relationship("Environment", back_populates="policies")


class EnvironmentRestriction(Base):
    __tablename__ = "environment_restrictions"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    environment = relationship("Environment", back_populates="restrictions")


class EnvironmentResource(Base):
    __tablename__ = "environment_resources"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"), nullable=False)
    is_fixed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    environment = relationship("Environment", back_populates="resources")
    resource = relationship("Resource", back_populates="environment_links")


class EnvironmentRequirement(Base):
    __tablename__ = "environment_requirements"

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"), nullable=False
    )
    qualification_id: Mapped[int] = mapped_column(
        ForeignKey("qualifications.id"), nullable=False
    )

    environment = relationship("Environment", back_populates="requirements")
    qualification = relationship(
        "Qualification", back_populates="environment_requirements"
    )
