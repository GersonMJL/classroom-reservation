from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.resources.resource_rules import assert_attachment_consistency
from app.shared.enums import ResourceAttachment, ResourceCategory, ResourceType


class ResourceBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: ResourceType
    category: ResourceCategory
    attachment_type: ResourceAttachment
    environment_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _validate_attachment(self) -> "ResourceBase":
        assert_attachment_consistency(
            attachment_type=self.attachment_type.value,
            environment_id=self.environment_id,
        )
        return self


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: ResourceType | None = None
    category: ResourceCategory | None = None
    attachment_type: ResourceAttachment | None = None
    environment_id: int | None = Field(default=None, gt=0)
    active: bool | None = None


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: ResourceType
    category: ResourceCategory
    attachment_type: ResourceAttachment
    environment_id: int | None
    active: bool
