"""Regra de restrição de novas reservas por penalidade ativa (UC08 passo 5, E1).

Uma penalidade restringe novas reservas quando está ``APPLIED`` ou
``UNDER_APPEAL`` e seu ``end_date`` ainda não passou. Penalidades sem
``end_date`` (manuais sem duração) não restringem, evitando bloqueio indefinido.
"""

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.governance.models import Penalty
from app.shared.enums import PenaltyStatus

BLOCKING_PENALTY_STATUSES: frozenset[PenaltyStatus] = frozenset(
    {PenaltyStatus.APPLIED, PenaltyStatus.UNDER_APPEAL}
)


def active_restriction(penalties: list[Penalty], now: datetime) -> Penalty | None:
    """Retorna a primeira penalidade que restringe novas reservas, ou ``None``."""
    for penalty in penalties:
        if penalty.status not in BLOCKING_PENALTY_STATUSES:
            continue
        if penalty.end_date is not None and penalty.end_date > now:
            return penalty
    return None


class RestrictionGuard:
    """Consulta penalidades ativas do usuário e bloqueia a criação se houver
    restrição vigente."""

    def __init__(self, repository) -> None:
        self.repository = repository

    def assert_allowed(self, *, user_id: int, now: datetime | None = None) -> None:
        now = now or datetime.now(UTC)
        penalties = self.repository.list_active_for_user(user_id=user_id, now=now)
        blocking = active_restriction(penalties, now)
        if blocking is not None:
            until = (
                blocking.end_date.strftime("%d/%m/%Y")
                if blocking.end_date is not None
                else "—"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Solicitante com restrição ativa até {until}: "
                    f"{blocking.description}"
                ),
            )
