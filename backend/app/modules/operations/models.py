from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Incidente(Base):
    __tablename__ = "incidentes"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    descricao: Mapped[str] = mapped_column(String(1000), nullable=False)
    severidade: Mapped[str] = mapped_column(String(64), nullable=False)
    reportado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    reserva = relationship("Reserva", back_populates="incidentes")


class EmprestimoRecurso(Base):
    __tablename__ = "emprestimos_recurso"

    recurso_id: Mapped[int] = mapped_column(ForeignKey("recursos.id"), nullable=False)
    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    hora_retirada: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hora_devolucao_prevista: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hora_devolucao: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    recurso = relationship("Recurso", back_populates="emprestimos")
    reserva = relationship("Reserva", back_populates="emprestimos_recurso")
