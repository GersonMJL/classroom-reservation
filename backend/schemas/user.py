from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List


class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    full_name: Optional[str] = None


class UserInDB(UserBase):
    id: int
    hashed_password: str
    full_name: Optional[str] = None
    roles: List[str] = ["user"]

    model_config = ConfigDict(from_attributes=True)


class User(UserBase):
    id: int
    full_name: Optional[str] = None
    roles: List[str] = ["user"]

    model_config = ConfigDict(from_attributes=True)


class UserRolesUpdate(BaseModel):
    roles: List[str]
