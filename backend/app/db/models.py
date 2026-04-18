from app.modules.audit.models import RegistroAuditoria, VersaoReserva
from app.modules.environments.models import (
    Ambiente,
    ManutencaoAmbiente,
    PoliticaReserva,
    RequisitoAmbiente,
    RestricaoAmbiente,
)
from app.modules.governance.models import Apelo, Penalidade
from app.modules.locations.models import Localizacao
from app.modules.operations.models import EmprestimoRecurso, Incidente
from app.modules.organizational_units.models import UnidadeOrganizacional
from app.modules.qualifications.models import QualificacaoUsuario, Qualificacao
from app.modules.resources.models import (
    DisponibilidadeRecurso,
    EscalaTecnico,
    ManutencaoRecurso,
    Recurso,
)
from app.modules.reservations.models import (
    Aprovacao,
    BloqueioCalendario,
    BufferExecucao,
    DependenciaReserva,
    HistoricoStatusReserva,
    RecursoReserva,
    Reserva,
    ReservaComposta,
    ReservaCompostaItem,
    StatusReserva,
    SuporteReserva,
)
from app.modules.users.models import Papel, Usuario, UsuarioPapel

__all__ = [
    "Ambiente",
    "Apelo",
    "Aprovacao",
    "BloqueioCalendario",
    "BufferExecucao",
    "DependenciaReserva",
    "DisponibilidadeRecurso",
    "EmprestimoRecurso",
    "EscalaTecnico",
    "HistoricoStatusReserva",
    "Incidente",
    "Localizacao",
    "ManutencaoAmbiente",
    "ManutencaoRecurso",
    "Papel",
    "Penalidade",
    "PoliticaReserva",
    "QualificacaoUsuario",
    "Qualificacao",
    "RecursoReserva",
    "Recurso",
    "RegistroAuditoria",
    "Reserva",
    "ReservaComposta",
    "ReservaCompostaItem",
    "RequisitoAmbiente",
    "RestricaoAmbiente",
    "StatusReserva",
    "SuporteReserva",
    "UnidadeOrganizacional",
    "Usuario",
    "UsuarioPapel",
    "VersaoReserva",
]
