from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QualificationBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=1000)


class QualificationCreate(QualificationBase):
    pass


class QualificationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=1000)


class QualificationRead(QualificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class UserQualificationCreate(BaseModel):
    user_id: int
    qualification_id: int
    valid_until: datetime


class UserQualificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    qualification_id: int
    valid_until: datetime | None
