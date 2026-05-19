from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.shared.enums import ReservationStatus, ReservationType, SupportType


class ReservationResourceCreate(BaseModel):
    resource_id: int = Field(gt=0)


class ReservationResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resource_id: int


class ReservationSupportCreate(BaseModel):
    support_type: SupportType
    responsible_staff_id: int | None = Field(default=None, gt=0)


class ReservationSupportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    support_type: SupportType
    responsible_staff_id: int | None = None


class ReservationBase(BaseModel):
    environment_id: int = Field(gt=0)
    requester_id: int = Field(gt=0)
    responsible_id: int = Field(gt=0)
    start_time: datetime
    end_time: datetime
    purpose: str = Field(min_length=1, max_length=128)
    participant_count: int = Field(ge=1)
    type: ReservationType = ReservationType.SIMPLE

    @model_validator(mode="after")
    def _validate_window_and_type(self) -> "ReservationBase":
        if self.end_time <= self.start_time:
            raise ValueError("end_time deve ser maior que start_time")
        if self.type is not ReservationType.SIMPLE:
            raise ValueError("Apenas reservas do tipo SIMPLE são aceitas nesta versão")
        return self


class ReservationCreate(ReservationBase):
    resources: list[ReservationResourceCreate] = Field(default_factory=list)
    support: list[ReservationSupportCreate] = Field(default_factory=list)


class ReservationUpdate(BaseModel):
    environment_id: int | None = Field(default=None, gt=0)
    responsible_id: int | None = Field(default=None, gt=0)
    start_time: datetime | None = None
    end_time: datetime | None = None
    purpose: str | None = Field(default=None, min_length=1, max_length=128)
    participant_count: int | None = Field(default=None, ge=1)
    resources: list[ReservationResourceCreate] | None = None
    support: list[ReservationSupportCreate] | None = None

    @model_validator(mode="after")
    def _validate_window(self) -> "ReservationUpdate":
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError("end_time deve ser maior que start_time")
        return self


class ReservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    environment_id: int
    requester_id: int
    responsible_id: int
    start_time: datetime
    end_time: datetime
    status: ReservationStatus
    type: ReservationType
    purpose: str
    participant_count: int
    checkin_at: datetime | None = None
    checkout_at: datetime | None = None
    resources: list[ReservationResourceRead] = Field(default_factory=list)
    support: list[ReservationSupportRead] = Field(default_factory=list)


class ReservationCancel(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
