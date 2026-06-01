"""Sugestão pura de próximos horários livres para uma reserva (UC03 E1)."""

from datetime import datetime, timedelta


def suggest_slots(
    *,
    desired_start: datetime,
    duration_minutes: int,
    busy: list[tuple[datetime, datetime]],
    day_end: datetime,
    max_suggestions: int = 3,
    step_minutes: int = 30,
) -> list[tuple[datetime, datetime]]:
    """Propõe até ``max_suggestions`` janelas livres de ``duration_minutes``,
    a partir de ``desired_start``, sem sobrepor ``busy``, dentro de ``day_end``."""
    duration = timedelta(minutes=duration_minutes)
    step = timedelta(minutes=step_minutes)
    slots: list[tuple[datetime, datetime]] = []
    cursor = desired_start
    while len(slots) < max_suggestions and cursor + duration <= day_end:
        candidate_end = cursor + duration
        overlaps = any(
            cursor < b_end and candidate_end > b_start for b_start, b_end in busy
        )
        if overlaps:
            cursor = cursor + step
        else:
            slots.append((cursor, candidate_end))
            cursor = candidate_end
    return slots
