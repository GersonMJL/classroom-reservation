# backend/app/modules/operations/schemas.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import IncidentSeverity


class IncidentCreate(BaseModel):
    reservation_id: int = Field(gt=0)
    description: str = Field(min_length=1, max_length=1000)
    severity: IncidentSeverity


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reservation_id: int
    description: str
    severity: IncidentSeverity
    reported_at: datetime
