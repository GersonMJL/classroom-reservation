"""Scheduler assíncrono mínimo para o job periódico de no-show (UC05 E1, RF09).

``run_periodic`` é puro o suficiente para ser testado com ``asyncio.run`` e um
job/fake. ``noshow_job`` abre uma sessão própria e chama ``mark_noshows``.
"""

import asyncio
import logging
from collections.abc import Callable

logger = logging.getLogger(__name__)


async def run_periodic(
    job: Callable[[], None],
    interval_seconds: float,
    *,
    stop_event: asyncio.Event,
) -> None:
    """Executa ``job`` a cada ``interval_seconds`` até ``stop_event`` ser sinalizado.

    Encerra imediatamente se ``stop_event`` já estiver setado na entrada.
    """
    while not stop_event.is_set():
        try:
            job()
        except Exception:  # noqa: BLE001 - job não deve derrubar o loop
            logger.exception("Falha ao executar job periódico")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
        except asyncio.TimeoutError:
            continue


def noshow_job() -> None:
    """Job de produção: abre sessão e marca no-shows vencidos.

    É síncrono e roda dentro do event loop; deve permanecer curto (uma consulta
    indexada + updates pontuais). Se o volume crescer, mover para
    ``asyncio.to_thread`` em ``run_periodic``.
    """
    from app.db.session import session_factory
    from app.modules.reservations.noshow_job import mark_noshows

    db = session_factory()
    try:
        changed = mark_noshows(db)
        if changed:
            logger.info("No-show automático aplicado às reservas %s", changed)
    finally:
        db.close()


def overtime_job() -> None:
    """Job de produção: abre sessão e aplica penalidade de overtime em reservas sem check-out."""
    from app.db.session import session_factory
    from app.modules.reservations.overtime_job import mark_overtime

    db = session_factory()
    try:
        changed = mark_overtime(db)
        if changed:
            logger.info("Overtime automático aplicado às reservas %s", changed)
    finally:
        db.close()
