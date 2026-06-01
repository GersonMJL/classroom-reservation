"""Regra pura: quais blocos de calendário efetivamente bloqueiam uma reserva.

Blocos ``BUFFER`` pertencentes à própria reserva em edição não devem colidir
com ela. Buffers de outras reservas — e qualquer bloco não-BUFFER — bloqueiam.
"""

from app.modules.reservations.models import CalendarBlock
from app.shared.enums import CalendarBlockType


def filter_blocking(
    blocks: list[CalendarBlock], *, exclude_reservation_id: int | None
) -> list[CalendarBlock]:
    result: list[CalendarBlock] = []
    for block in blocks:
        is_own_buffer = (
            block.type == CalendarBlockType.BUFFER
            and exclude_reservation_id is not None
            and block.reservation_id == exclude_reservation_id
        )
        if is_own_buffer:
            continue
        result.append(block)
    return result
