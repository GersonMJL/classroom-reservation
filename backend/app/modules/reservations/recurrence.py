from datetime import datetime, timedelta


def expand_weekly(
    start: datetime,
    end: datetime,
    *,
    weekdays: list[int],
    occurrences: int,
) -> list[tuple[datetime, datetime]]:
    """Expande uma janela inicial em N ocorrências semanais que caem nos
    ``weekdays`` (0=segunda, 6=domingo). Preserva a duração ``end - start``.
    """
    duration = end - start
    out: list[tuple[datetime, datetime]] = []
    cursor = start
    safety = 0
    while len(out) < occurrences and safety < 365:
        if cursor.weekday() in weekdays:
            out.append((cursor, cursor + duration))
        cursor += timedelta(days=1)
        safety += 1
    return out
