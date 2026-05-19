from pydantic import BaseModel, ConfigDict, Field


class LocationBase(BaseModel):
    campus: str = Field(min_length=1, max_length=255)
    building: str = Field(min_length=1, max_length=255)
    floor: str = Field(min_length=1, max_length=64)


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    campus: str | None = Field(default=None, min_length=1, max_length=255)
    building: str | None = Field(default=None, min_length=1, max_length=255)
    floor: str | None = Field(default=None, min_length=1, max_length=64)


class LocationRead(LocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
