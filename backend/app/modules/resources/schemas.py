from pydantic import BaseModel, ConfigDict, Field


class ResourceBase(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    tipo: str = Field(min_length=1, max_length=64)
    categoria: str = Field(min_length=1, max_length=64)
    tipo_vinculo: str = Field(pattern="^(FIXO|MOVEL)$")
    ambiente_id: int | None = Field(default=None, gt=0)


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    tipo: str | None = Field(default=None, min_length=1, max_length=64)
    categoria: str | None = Field(default=None, min_length=1, max_length=64)
    tipo_vinculo: str | None = Field(default=None, pattern="^(FIXO|MOVEL)$")
    ambiente_id: int | None = Field(default=None, gt=0)
    ativo: bool | None = None


class ResourceRead(ResourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ativo: bool
