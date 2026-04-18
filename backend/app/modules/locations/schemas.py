from pydantic import BaseModel, ConfigDict, Field


class LocationBase(BaseModel):
    campus: str = Field(min_length=1, max_length=255)
    predio: str = Field(min_length=1, max_length=255)
    andar: str = Field(min_length=1, max_length=64)


class LocationRead(LocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
