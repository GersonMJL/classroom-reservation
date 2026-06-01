"""Geração de buffers de calendário (CalendarBlock type=BUFFER) ao redor da reserva.

Em Fase 2 esta função existe mas não é chamada — reservas nascem em
``PENDING_APPROVAL`` e o ciclo de buffer só faz sentido quando a reserva é
efetivamente aprovada (Fase 3, fluxo de aprovação).
"""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.environments.models import Environment
from app.modules.reservations.models import CalendarBlock, Reservation
from app.shared.enums import CalendarBlockType


def create_buffer_blocks(
    *,
    reservation: Reservation,
    environment: Environment,
    session: Session,
) -> list[CalendarBlock]:
    """Cria CalendarBlock BUFFER antes/depois da reserva. Idempotente."""
    blocks: list[CalendarBlock] = []

    before_min = environment.buffer_before_min or 0
    after_min = environment.buffer_after_min or 0

    if before_min > 0:
        block = _ensure_block(
            session=session,
            environment_id=environment.id,
            reservation_id=reservation.id,
            start=reservation.start_time - timedelta(minutes=before_min),
            end=reservation.start_time,
        )
        if block is not None:
            blocks.append(block)

    if after_min > 0:
        block = _ensure_block(
            session=session,
            environment_id=environment.id,
            reservation_id=reservation.id,
            start=reservation.end_time,
            end=reservation.end_time + timedelta(minutes=after_min),
        )
        if block is not None:
            blocks.append(block)

    if blocks:
        session.flush()
    return blocks


def _ensure_block(
    *,
    session: Session,
    environment_id: int,
    reservation_id: int,
    start,
    end,
) -> CalendarBlock | None:
    existing = (
        session.execute(
            select(CalendarBlock)
            .where(CalendarBlock.environment_id == environment_id)
            .where(CalendarBlock.type == CalendarBlockType.BUFFER)
            .where(CalendarBlock.start_time == start)
            .where(CalendarBlock.end_time == end)
        )
        .scalars()
        .first()
    )
    if existing is not None:
        return None

    block = CalendarBlock(
        environment_id=environment_id,
        reservation_id=reservation_id,
        start_time=start,
        end_time=end,
        type=CalendarBlockType.BUFFER,
        priority="NORMAL",
    )
    session.add(block)
    return block


def release_buffer_early(
    *,
    buffer_block: CalendarBlock,
    session: Session,
    released_by_user_id: int,
    notes: str | None,
) -> CalendarBlock:
    """Encurta o CalendarBlock BUFFER para o instante atual.

    Idempotente: se ``now`` já passou de ``end_time`` ou ainda não chegou ao
    ``start_time``, retorna o bloco inalterado.
    """
    now = datetime.now(buffer_block.start_time.tzinfo)
    if now <= buffer_block.start_time or now >= buffer_block.end_time:
        return buffer_block
    buffer_block.end_time = now
    session.flush()
    return buffer_block
