"""Testes da função pura de sugestão de horários livres (UC03 E1)."""

from datetime import datetime, timezone

from app.modules.reservations.slot_suggester import suggest_slots

T = lambda h, m=0: datetime(2026, 6, 1, h, m, tzinfo=timezone.utc)  # noqa: E731


def test_suggests_next_free_slot_after_busy():
    busy = [(T(10), T(11))]  # ocupado 10–11
    slots = suggest_slots(
        desired_start=T(10),
        duration_minutes=60,
        busy=busy,
        day_end=T(22),
        max_suggestions=2,
        step_minutes=30,
    )
    assert slots[0] == (T(11), T(12))


def test_returns_desired_slot_when_free():
    slots = suggest_slots(
        desired_start=T(14),
        duration_minutes=60,
        busy=[],
        day_end=T(22),
        max_suggestions=1,
    )
    assert slots[0] == (T(14), T(15))


def test_respects_day_end():
    slots = suggest_slots(
        desired_start=T(21, 30),
        duration_minutes=60,
        busy=[],
        day_end=T(22),
        max_suggestions=3,
    )
    assert slots == []


def test_limits_number_of_suggestions():
    slots = suggest_slots(
        desired_start=T(8),
        duration_minutes=60,
        busy=[],
        day_end=T(22),
        max_suggestions=2,
    )
    assert len(slots) == 2
