from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import ResourceType


class ResourceBase(BaseModel):
    resource_code: str
    name: str
    resource_type: ResourceType
    availability_notes: str | None = None


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    resource_code: str | None = None
    name: str | None = None
    resource_type: ResourceType | None = None
    availability_notes: str | None = None
    is_active: bool | None = None


class ResourceRead(ResourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
