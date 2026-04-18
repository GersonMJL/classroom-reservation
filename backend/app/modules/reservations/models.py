from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StatusReserva(Base):
    __tablename__ = "status_reserva"

    nome: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)


class Reserva(Base):
    __tablename__ = "reservas"

    reserva_mestre_id: Mapped[int | None] = mapped_column(
        ForeignKey("reservas.id"), nullable=True
    )
    ambiente_id: Mapped[int] = mapped_column(ForeignKey("ambientes.id"), nullable=False)
    solicitante_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False
    )
    responsavel_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False
    )
    hora_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hora_fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status_id: Mapped[int | None] = mapped_column(
        ForeignKey("status_reserva.id"), nullable=True
    )
    num_participantes: Mapped[int] = mapped_column(Integer, nullable=False)
    proposito: Mapped[str] = mapped_column(String(128), nullable=False)
    checkin_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checkout_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    regra_recorrencia: Mapped[str | None] = mapped_column(String(255), nullable=True)

    reserva_mae = relationship(
        "Reserva", remote_side="Reserva.id", back_populates="filhos"
    )
    filhos = relationship("Reserva", back_populates="reserva_mae")
    status = relationship("StatusReserva")

    ambiente = relationship("Ambiente", back_populates="reservas")
    solicitante = relationship(
        "Usuario",
        foreign_keys=[solicitante_id],
        back_populates="reservas_solicitadas",
    )
    responsavel = relationship(
        "Usuario",
        foreign_keys=[responsavel_id],
        back_populates="reservas_responsavel",
    )

    dependencias = relationship(
        "DependenciaReserva",
        foreign_keys="DependenciaReserva.reserva_id",
        back_populates="reserva",
        cascade="all, delete-orphan",
    )
    dependente_de = relationship(
        "DependenciaReserva",
        foreign_keys="DependenciaReserva.depende_de_reserva_id",
        back_populates="depende_de_reserva",
    )
    recursos = relationship(
        "RecursoReserva", back_populates="reserva", cascade="all, delete-orphan"
    )
    suportes = relationship(
        "SuporteReserva", back_populates="reserva", cascade="all, delete-orphan"
    )
    aprovacoes = relationship(
        "Aprovacao", back_populates="reserva", cascade="all, delete-orphan"
    )
    incidentes = relationship(
        "Incidente", back_populates="reserva", cascade="all, delete-orphan"
    )
    penalidades = relationship("Penalidade", back_populates="reserva")
    versoes = relationship(
        "VersaoReserva", back_populates="reserva", cascade="all, delete-orphan"
    )
    emprestimos_recurso = relationship("EmprestimoRecurso", back_populates="reserva")
    historico_status = relationship(
        "HistoricoStatusReserva",
        back_populates="reserva",
        cascade="all, delete-orphan",
    )
    buffers = relationship(
        "BufferExecucao", back_populates="reserva", cascade="all, delete-orphan"
    )


class DependenciaReserva(Base):
    __tablename__ = "dependencias_reserva"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    depende_de_reserva_id: Mapped[int] = mapped_column(
        ForeignKey("reservas.id"), nullable=False
    )

    reserva = relationship(
        "Reserva", foreign_keys=[reserva_id], back_populates="dependencias"
    )
    depende_de_reserva = relationship(
        "Reserva",
        foreign_keys=[depende_de_reserva_id],
        back_populates="dependente_de",
    )


class RecursoReserva(Base):
    __tablename__ = "recursos_reserva"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    recurso_id: Mapped[int] = mapped_column(ForeignKey("recursos.id"), nullable=False)

    reserva = relationship("Reserva", back_populates="recursos")
    recurso = relationship("Recurso", back_populates="recursos_reserva")


class SuporteReserva(Base):
    __tablename__ = "suporte_reserva"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    tipo_suporte: Mapped[str] = mapped_column(String(64), nullable=False)
    funcionario_responsavel_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )

    reserva = relationship("Reserva", back_populates="suportes")
    funcionario_responsavel = relationship(
        "Usuario", back_populates="suportes_atribuidos"
    )


class Aprovacao(Base):
    __tablename__ = "aprovacoes"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    aprovador_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    tipo: Mapped[str] = mapped_column(
        String(64), nullable=False, server_default="INITIAL"
    )
    data_decisao: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    comentarios: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    reserva = relationship("Reserva", back_populates="aprovacoes")
    aprovador = relationship("Usuario", back_populates="aprovacoes")


class BloqueioCalendario(Base):
    __tablename__ = "bloqueios_calendario"

    ambiente_id: Mapped[int] = mapped_column(ForeignKey("ambientes.id"), nullable=False)
    hora_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hora_fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    prioridade: Mapped[str] = mapped_column(String(64), nullable=False)

    ambiente = relationship("Ambiente", back_populates="bloqueios_calendario")


class HistoricoStatusReserva(Base):
    __tablename__ = "historico_status_reserva"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    status_anterior_id: Mapped[int | None] = mapped_column(
        ForeignKey("status_reserva.id"), nullable=True
    )
    status_novo_id: Mapped[int] = mapped_column(
        ForeignKey("status_reserva.id"), nullable=False
    )
    data_mudanca: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    motivo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    reserva = relationship("Reserva", back_populates="historico_status")
    status_anterior = relationship(
        "StatusReserva", foreign_keys=[status_anterior_id]
    )
    status_novo = relationship("StatusReserva", foreign_keys=[status_novo_id])
    usuario = relationship("Usuario")


class BufferExecucao(Base):
    __tablename__ = "buffer_execucao"

    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    ambiente_id: Mapped[int] = mapped_column(ForeignKey("ambientes.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(32), nullable=False)
    hora_prevista_fim: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hora_real_fim: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    liberado_por: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    observacao: Mapped[str | None] = mapped_column(String(500), nullable=True)

    reserva = relationship("Reserva", back_populates="buffers")
    ambiente = relationship("Ambiente")
    liberado_por_usuario = relationship("Usuario", foreign_keys=[liberado_por])


class ReservaComposta(Base):
    __tablename__ = "reserva_composta"

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    itens = relationship(
        "ReservaCompostaItem",
        back_populates="reserva_composta",
        cascade="all, delete-orphan",
    )


class ReservaCompostaItem(Base):
    __tablename__ = "reserva_composta_item"
    __table_args__ = (
        UniqueConstraint(
            "reserva_composta_id", "reserva_id", name="uq_reserva_composta_item"
        ),
    )

    reserva_composta_id: Mapped[int] = mapped_column(
        ForeignKey("reserva_composta.id"), nullable=False
    )
    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), nullable=False)
    critico: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)

    reserva_composta = relationship("ReservaComposta", back_populates="itens")
    reserva = relationship("Reserva")
