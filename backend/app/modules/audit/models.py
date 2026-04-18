from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class VersaoReserva(Base):
    __tablename__ = "versoes_reserva"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    alterado_por: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    alterado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    resumo_alteracao: Mapped[str] = mapped_column(String(1000), nullable=False)

    reserva = relationship("Reserva", back_populates="versoes")
    alterado_por_usuario = relationship(
        "Usuario", back_populates="versoes_reserva"
    )


class RegistroAuditoria(Base):
    __tablename__ = "registros_auditoria"

    tipo_entidade: Mapped[str] = mapped_column(String(128), nullable=False)
    id_alvo: Mapped[int] = mapped_column(nullable=False)
    acao: Mapped[str] = mapped_column(String(64), nullable=False)
    realizado_por: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False
    )
    realizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    estado_anterior: Mapped[str | None] = mapped_column(String(4000), nullable=True)
    estado_posterior: Mapped[str | None] = mapped_column(String(4000), nullable=True)

    realizado_por_usuario = relationship(
        "Usuario", back_populates="registros_auditoria"
    )
