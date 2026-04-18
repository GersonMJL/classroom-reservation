from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.organizational_units.models import UnidadeOrganizacional


class Usuario(Base):
    __tablename__ = "usuarios"

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    unidade_organizacional_id: Mapped[int | None] = mapped_column(
        ForeignKey("unidades_organizacionais.id"), nullable=True
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    unidade_organizacional: Mapped["UnidadeOrganizacional"] = relationship(
        "UnidadeOrganizacional", back_populates="usuarios"
    )
    reservas_solicitadas = relationship(
        "Reserva", foreign_keys="Reserva.solicitante_id", back_populates="solicitante"
    )
    reservas_responsavel = relationship(
        "Reserva", foreign_keys="Reserva.responsavel_id", back_populates="responsavel"
    )
    qualificacoes = relationship(
        "QualificacaoUsuario", back_populates="usuario", cascade="all, delete-orphan"
    )
    penalidades = relationship(
        "Penalidade", foreign_keys="Penalidade.usuario_id", back_populates="usuario"
    )
    aprovacoes = relationship("Aprovacao", back_populates="aprovador")
    suportes_atribuidos = relationship(
        "SuporteReserva", back_populates="funcionario_responsavel"
    )
    versoes_reserva = relationship("VersaoReserva", back_populates="alterado_por_usuario")
    registros_auditoria = relationship(
        "RegistroAuditoria", back_populates="realizado_por_usuario"
    )
    usuario_papeis = relationship(
        "UsuarioPapel", back_populates="usuario", cascade="all, delete-orphan"
    )


class Papel(Base):
    __tablename__ = "papeis"

    codigo: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    nome: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )

    papeis_usuario = relationship(
        "UsuarioPapel", back_populates="papel", cascade="all, delete-orphan"
    )


class UsuarioPapel(Base):
    __tablename__ = "usuario_papeis"
    __table_args__ = (
        UniqueConstraint("usuario_id", "papel_id", name="uq_usuario_papel"),
    )

    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    papel_id: Mapped[int] = mapped_column(ForeignKey("papeis.id"), nullable=False)

    usuario = relationship("Usuario", back_populates="usuario_papeis")
    papel = relationship("Papel", back_populates="papeis_usuario")
