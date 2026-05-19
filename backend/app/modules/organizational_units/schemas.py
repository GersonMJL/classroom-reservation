from pydantic import BaseModel, ConfigDict, Field


class OrganizationalUnitBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=64)


class OrganizationalUnitCreate(OrganizationalUnitBase):
    pass


class OrganizationalUnitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, min_length=1, max_length=64)


class OrganizationalUnitRead(OrganizationalUnitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
