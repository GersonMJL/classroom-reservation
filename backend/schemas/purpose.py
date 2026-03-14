from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PurposeBase(BaseModel):
    name: str = Field(..., min_length=1)


class PurposeCreate(PurposeBase):
    pass


class PurposeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    is_active: Optional[bool] = None


class Purpose(PurposeBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
