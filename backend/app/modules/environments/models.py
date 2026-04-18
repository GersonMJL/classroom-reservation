from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Ambiente(Base):
    __tablename__ = "ambientes"

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    criticidade: Mapped[str] = mapped_column(String(64), nullable=False)
    capacidade: Mapped[int] = mapped_column(Integer, nullable=False)
    localizacao_id: Mapped[int] = mapped_column(
        ForeignKey("localizacoes.id"), nullable=False
    )
    horario_funcionamento: Mapped[str] = mapped_column(String(255), nullable=False)
    requer_aprovacao: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    buffer_antes_min: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default="0"
    )
    buffer_depois_min: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default="0"
    )
    ativo: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, server_default="true"
    )

    localizacao = relationship("Localizacao", back_populates="ambientes")
    politicas = relationship(
        "PoliticaReserva", back_populates="ambiente", cascade="all, delete-orphan"
    )
    restricoes = relationship(
        "RestricaoAmbiente", back_populates="ambiente", cascade="all, delete-orphan"
    )
    recursos = relationship("Recurso", back_populates="ambiente")
    requisitos = relationship(
        "RequisitoAmbiente", back_populates="ambiente", cascade="all, delete-orphan"
    )
    reservas = relationship("Reserva", back_populates="ambiente")
    bloqueios_calendario = relationship(
        "BloqueioCalendario", back_populates="ambiente", cascade="all, delete-orphan"
    )
    manutencoes = relationship(
        "ManutencaoAmbiente", back_populates="ambiente", cascade="all, delete-orphan"
    )


class PoliticaReserva(Base):
    __tablename__ = "politica_reserva"

    ambiente_id: Mapped[int] = mapped_column(
        ForeignKey("ambientes.id"), nullable=False
    )
    papel_id: Mapped[int] = mapped_column(ForeignKey("papeis.id"), nullable=False)
    antecedencia_min_horas: Mapped[int] = mapped_column(Integer, nullable=False)
    antecedencia_max_dias: Mapped[int] = mapped_column(Integer, nullable=False)

    ambiente = relationship("Ambiente", back_populates="politicas")
    papel = relationship("Papel")


class RestricaoAmbiente(Base):
    __tablename__ = "restricoes_ambiente"

    ambiente_id: Mapped[int] = mapped_column(
        ForeignKey("ambientes.id"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    descricao: Mapped[str] = mapped_column(String(1000), nullable=False)

    ambiente = relationship("Ambiente", back_populates="restricoes")


class RequisitoAmbiente(Base):
    __tablename__ = "requisitos_ambiente"

    ambiente_id: Mapped[int] = mapped_column(
        ForeignKey("ambientes.id"), nullable=False
    )
    qualificacao_id: Mapped[int] = mapped_column(
        ForeignKey("qualificacoes.id"), nullable=False
    )

    ambiente = relationship("Ambiente", back_populates="requisitos")
    qualificacao = relationship("Qualificacao", back_populates="requisitos_ambiente")


class ManutencaoAmbiente(Base):
    __tablename__ = "manutencao_ambiente"

    ambiente_id: Mapped[int] = mapped_column(
        ForeignKey("ambientes.id"), nullable=False
    )
    data_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    motivo: Mapped[str] = mapped_column(String(500), nullable=False)

    ambiente = relationship("Ambiente", back_populates="manutencoes")
