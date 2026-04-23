from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import CriticidadeAmbiente, TipoAmbiente


class EnvironmentBase(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    tipo: TipoAmbiente
    criticidade: CriticidadeAmbiente
    capacidade: int = Field(gt=0)
    localizacao_id: int = Field(gt=0)
    horario_funcionamento: str = Field(min_length=1, max_length=255)
    requer_aprovacao: bool = False
    buffer_antes_min: int = Field(default=0, ge=0)
    buffer_depois_min: int = Field(default=0, ge=0)
    ativo: bool = True


class EnvironmentCreate(EnvironmentBase):
    pass


class EnvironmentUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    tipo: TipoAmbiente | None = None
    criticidade: CriticidadeAmbiente | None = None
    capacidade: int | None = Field(default=None, gt=0)
    localizacao_id: int | None = Field(default=None, gt=0)
    horario_funcionamento: str | None = Field(default=None, min_length=1, max_length=255)
    requer_aprovacao: bool | None = None
    buffer_antes_min: int | None = Field(default=None, ge=0)
    buffer_depois_min: int | None = Field(default=None, ge=0)
    ativo: bool | None = None


class EnvironmentRead(EnvironmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class PoliticaReservaBase(BaseModel):
    ambiente_id: int = Field(gt=0)
    papel_id: int = Field(gt=0)
    antecedencia_min_horas: int = Field(ge=0)
    antecedencia_max_dias: int = Field(ge=1)


class PoliticaReservaCreate(PoliticaReservaBase):
    pass


class PoliticaReservaRead(PoliticaReservaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
