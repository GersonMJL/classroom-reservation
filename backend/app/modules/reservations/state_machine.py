"""Fonte única de verdade das transições de status da reserva.

Em Fase 2, toda reserva nasce em ``PENDING_APPROVAL`` (auto-aprovação fica para
Fase 3). Por isso ``PENDING_APPROVAL`` é tratado como bloqueante no calendário,
evitando double-booking antes da decisão do aprovador.
"""

from app.shared.enums import ReservationStatus

ALLOWED_TRANSITIONS: dict[ReservationStatus, set[ReservationStatus]] = {
    ReservationStatus.DRAFT: {
        ReservationStatus.PENDING_APPROVAL,
        ReservationStatus.CANCELLED,
    },
    ReservationStatus.PENDING_APPROVAL: {
        ReservationStatus.APPROVED,
        ReservationStatus.REJECTED,
        ReservationStatus.DRAFT,
        ReservationStatus.CANCELLED,
    },
    ReservationStatus.PRE_BLOCKED: {
        ReservationStatus.APPROVED,
        ReservationStatus.CANCELLED,
    },
    ReservationStatus.APPROVED: {
        ReservationStatus.IN_USE,
        ReservationStatus.NO_SHOW,
        ReservationStatus.CANCELLED,
        ReservationStatus.EXPIRED,
        ReservationStatus.DRAFT,
    },
    ReservationStatus.IN_USE: {
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELLED,
    },
    ReservationStatus.REJECTED: set(),
    ReservationStatus.CANCELLED: set(),
    ReservationStatus.COMPLETED: set(),
    ReservationStatus.NO_SHOW: set(),
    ReservationStatus.EXPIRED: set(),
}

BLOCKING_STATUSES: frozenset[ReservationStatus] = frozenset(
    {
        ReservationStatus.PENDING_APPROVAL,
        ReservationStatus.PRE_BLOCKED,
        ReservationStatus.APPROVED,
        ReservationStatus.IN_USE,
    }
)

TERMINAL_STATUSES: frozenset[ReservationStatus] = frozenset(
    {
        ReservationStatus.REJECTED,
        ReservationStatus.CANCELLED,
        ReservationStatus.COMPLETED,
        ReservationStatus.NO_SHOW,
        ReservationStatus.EXPIRED,
    }
)

EDITABLE_STATUSES: frozenset[ReservationStatus] = frozenset(
    {ReservationStatus.DRAFT, ReservationStatus.PENDING_APPROVAL}
)


class InvalidTransitionError(Exception):
    def __init__(self, current: ReservationStatus, target: ReservationStatus) -> None:
        super().__init__(f"Transição inválida de {current.value} para {target.value}")
        self.current = current
        self.target = target


def assert_transition(current: ReservationStatus, target: ReservationStatus) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise InvalidTransitionError(current, target)


def can_edit(status: ReservationStatus) -> bool:
    return status in EDITABLE_STATUSES
