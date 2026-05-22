from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import AppealStatus, PenaltyStatus, PenaltyType


class PenaltyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    reservation_id: int
    type: PenaltyType
    status: PenaltyStatus
    description: str
    duration_days: int | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    applied_by: int | None = None


class PenaltyManualCreate(BaseModel):
    user_id: int = Field(gt=0)
    reservation_id: int = Field(gt=0)
    type: PenaltyType
    description: str = Field(min_length=1, max_length=1000)
    duration_days: int | None = Field(default=None, ge=1, le=365)


class AppealCreate(BaseModel):
    penalty_id: int = Field(gt=0)
    justification: str = Field(min_length=1, max_length=1000)


class AppealResolve(BaseModel):
    approve: bool
    resolution_notes: str = Field(min_length=1, max_length=1000)


class AppealRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    penalty_id: int
    status: AppealStatus
    resolution_notes: str | None = None
