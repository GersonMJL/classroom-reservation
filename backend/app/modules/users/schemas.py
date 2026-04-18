from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    nome: str
    email: EmailStr
    ativo: bool = True
    papeis: list[str] = Field(default_factory=list)


class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    ativo: bool = True
    papeis: list[str] = Field(default_factory=list)


class UserUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    ativo: bool | None = None
    papeis: list[str] | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
