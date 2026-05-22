from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.shared.enums import CalendarBlockType, EnvironmentCriticality, EnvironmentType


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
    noshow_tolerance_min: int = Field(default=15, ge=0)
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
    noshow_tolerance_min: int | None = Field(default=None, ge=0)
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


class CalendarBlockBase(BaseModel):
    environment_id: int = Field(gt=0)
    start_time: datetime
    end_time: datetime
    type: CalendarBlockType
    priority: str = Field(default="NORMAL", max_length=64)

    @model_validator(mode="after")
    def _validate_window(self) -> "CalendarBlockBase":
        if self.end_time <= self.start_time:
            raise ValueError("end_time deve ser maior que start_time")
        return self


class CalendarBlockCreate(CalendarBlockBase):
    pass


class CalendarBlockUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    type: CalendarBlockType | None = None
    priority: str | None = Field(default=None, max_length=64)


class CalendarBlockRead(CalendarBlockBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
