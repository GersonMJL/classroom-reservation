"""Regra de janela de tolerância para check-in (UC05 fluxo principal, PLANO §191).

O check-in é permitido até ``start_time + tolerância``. Depois disso a janela
expirou e a reserva é candidata a no-show — o check-in deve ser recusado.
"""

from datetime import datetime, timedelta


def checkin_window_expired(
    start_time: datetime, tolerance_min: int, *, now: datetime
) -> bool:
    """``True`` se ``now`` ultrapassou ``start_time + tolerance_min``.

    Usa ``>`` estrito: exatamente no prazo o check-in ainda é permitido. O
    ``mark_noshows`` usa ``>=`` (marca NO_SHOW no instante do prazo); essa
    assimetria de 1 instante é inofensiva — a máquina de estados impede
    APPROVED→IN_USE depois que a reserva já virou NO_SHOW.
    """
    deadline = start_time + timedelta(minutes=tolerance_min)
    return now > deadline
