from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ResourceBase(BaseModel):
    resource_code: str = Field(..., min_length=1, description="Unique resource code")
    name: str = Field(..., min_length=1, description="Resource display name")
    resource_type: str = Field(..., min_length=1, description="Resource category")
    availability_notes: Optional[str] = Field(
        default=None,
        description="Availability constraints or usage notes",
    )


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    resource_type: Optional[str] = Field(default=None, min_length=1)
    availability_notes: Optional[str] = None
    is_active: Optional[bool] = None


class Resource(ResourceBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
