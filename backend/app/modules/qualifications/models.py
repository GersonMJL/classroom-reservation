from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Qualificacao(Base):
    __tablename__ = "qualificacoes"

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str] = mapped_column(String(1000), nullable=False)

    qualificacoes_usuario = relationship(
        "QualificacaoUsuario",
        back_populates="qualificacao",
        cascade="all, delete-orphan",
    )
    requisitos_ambiente = relationship(
        "RequisitoAmbiente", back_populates="qualificacao"
    )


class QualificacaoUsuario(Base):
    __tablename__ = "qualificacoes_usuario"

    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    qualificacao_id: Mapped[int] = mapped_column(
        ForeignKey("qualificacoes.id"), nullable=False
    )
    valido_ate: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    usuario = relationship("Usuario", back_populates="qualificacoes")
    qualificacao = relationship("Qualificacao", back_populates="qualificacoes_usuario")
