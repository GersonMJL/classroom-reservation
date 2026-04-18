from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Recurso(Base):
    __tablename__ = "recursos"

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    categoria: Mapped[str] = mapped_column(
        String(64), nullable=False, server_default="GERAL"
    )
    tipo_vinculo: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default="MOVEL"
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    localizacao_atual_id: Mapped[int | None] = mapped_column(
        ForeignKey("localizacoes.id"), nullable=True
    )
    ambiente_id: Mapped[int | None] = mapped_column(
        ForeignKey("ambientes.id"), nullable=True
    )

    localizacao_atual = relationship("Localizacao", back_populates="recursos")
    ambiente = relationship("Ambiente", back_populates="recursos")
    recursos_reserva = relationship("RecursoReserva", back_populates="recurso")
    disponibilidades = relationship(
        "DisponibilidadeRecurso",
        back_populates="recurso",
        cascade="all, delete-orphan",
    )
    emprestimos = relationship("EmprestimoRecurso", back_populates="recurso")


class DisponibilidadeRecurso(Base):
    __tablename__ = "disponibilidade_recurso"

    recurso_id: Mapped[int] = mapped_column(ForeignKey("recursos.id"), nullable=False)
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    disponivel: Mapped[bool] = mapped_column(Boolean, nullable=False)
    motivo: Mapped[str | None] = mapped_column(String(255), nullable=True)

    recurso = relationship("Recurso", back_populates="disponibilidades")


class EscalaTecnico(Base):
    __tablename__ = "escala_tecnico"

    tecnico_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    recurso_id: Mapped[int] = mapped_column(ForeignKey("recursos.id"), nullable=False)
    data_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    data_fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    tecnico = relationship("Usuario")
    recurso = relationship("Recurso")


class ManutencaoRecurso(Base):
    __tablename__ = "manutencao_recurso"

    recurso_id: Mapped[int] = mapped_column(ForeignKey("recursos.id"), nullable=False)
    data_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    data_fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    motivo: Mapped[str] = mapped_column(String(500), nullable=False)

    recurso = relationship("Recurso")
