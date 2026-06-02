"""Testes da regra pura de dependências de reserva composta."""

from app.modules.reservations.composite_dependencies import dependency_pairs


def test_single_critical_links_all_others():
    # itens: (reservation_id, critical)
    items = [(10, True), (11, False), (12, False)]
    pairs = dependency_pairs(items)
    assert sorted(pairs) == [(11, 10), (12, 10)]


def test_no_critical_means_no_dependencies():
    items = [(10, False), (11, False)]
    assert dependency_pairs(items) == []


def test_multiple_criticals_link_each():
    items = [(1, True), (2, True), (3, False)]
    assert sorted(dependency_pairs(items)) == [(3, 1), (3, 2)]


def test_critical_does_not_depend_on_itself():
    items = [(1, True), (2, True)]
    assert dependency_pairs(items) == []
