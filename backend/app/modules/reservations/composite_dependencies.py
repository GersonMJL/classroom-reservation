"""Regra pura: dependências entre itens de uma reserva composta (UC07).

Cada item não-crítico depende de cada item crítico (pré-requisito).
Itens críticos não dependem entre si.
"""


def dependency_pairs(items: list[tuple[int, bool]]) -> list[tuple[int, int]]:
    """``items``: lista de ``(reservation_id, critical)``.

    Retorna pares ``(dependente, pre_requisito)``.
    """
    criticals = [rid for rid, critical in items if critical]
    pairs: list[tuple[int, int]] = []
    for rid, critical in items:
        if critical:
            continue
        for prereq in criticals:
            pairs.append((rid, prereq))
    return pairs
