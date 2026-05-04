from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import EnvironmentCriticality, EnvironmentType


class EnvironmentBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: EnvironmentType
    criticality: EnvironmentCriticality
    capacity: int = Field(gt=0)
    location_id: int = Field(gt=0)
    operating_hours: str = Field(min_length=1, max_length=255)
    requires_approval: bool = False
    buffer_before_min: int = Field(default=0, ge=0)
    buffer_after_min: int = Field(default=0, ge=0)
    active: bool = True


class EnvironmentCreate(EnvironmentBase):
    pass


class EnvironmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: EnvironmentType | None = None
    criticality: EnvironmentCriticality | None = None
    capacity: int | None = Field(default=None, gt=0)
    location_id: int | None = Field(default=None, gt=0)
    operating_hours: str | None = Field(default=None, min_length=1, max_length=255)
    requires_approval: bool | None = None
    buffer_before_min: int | None = Field(default=None, ge=0)
    buffer_after_min: int | None = Field(default=None, ge=0)
    active: bool | None = None


class EnvironmentRead(EnvironmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ReservationPolicyBase(BaseModel):
    environment_id: int = Field(gt=0)
    role_id: int = Field(gt=0)
    min_lead_time_hours: int = Field(ge=0)
    max_lead_time_days: int = Field(ge=1)


class ReservationPolicyCreate(ReservationPolicyBase):
    pass


class ReservationPolicyRead(ReservationPolicyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
