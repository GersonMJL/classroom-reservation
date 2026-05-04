from pydantic import BaseModel, ConfigDict, Field


class ResourceBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=64)
    category: str = Field(min_length=1, max_length=64)
    attachment_type: str = Field(pattern="^(FIXED|MOBILE)$")
    environment_id: int | None = Field(default=None, gt=0)


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, min_length=1, max_length=64)
    category: str | None = Field(default=None, min_length=1, max_length=64)
    attachment_type: str | None = Field(default=None, pattern="^(FIXED|MOBILE)$")
    environment_id: int | None = Field(default=None, gt=0)
    active: bool | None = None


class ResourceRead(ResourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    active: bool
