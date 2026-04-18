from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Penalidade(Base):
    __tablename__ = "penalidades"

    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    descricao: Mapped[str] = mapped_column(String(1000), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    duracao_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    data_inicio: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    data_fim: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    aplicada_por: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )

    usuario = relationship(
        "Usuario", foreign_keys=[usuario_id], back_populates="penalidades"
    )
    reserva = relationship("Reserva", back_populates="penalidades")
    aplicada_por_usuario = relationship("Usuario", foreign_keys=[aplicada_por])
    apelos = relationship(
        "Apelo", back_populates="penalidade", cascade="all, delete-orphan"
    )


class Apelo(Base):
    __tablename__ = "apelos"

    penalidade_id: Mapped[int] = mapped_column(
        ForeignKey("penalidades.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    notas_resolucao: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    penalidade = relationship("Penalidade", back_populates="apelos")
