from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    name: str
    email: EmailStr
    is_active: bool = True
    roles: list[str] = Field(default_factory=list)


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    is_active: bool = True
    roles: list[str] = Field(default_factory=list)


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None
    roles: list[str] | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class UserReadWithAudit(UserRead):
    created_at: datetime
    updated_at: datetime
