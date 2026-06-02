"""Testes da regra pura de filtragem de blocos bloqueantes (buffers)."""

from datetime import datetime, timezone

import app.db.models  # noqa: F401 – registra todos os mappers SQLAlchemy
from app.modules.reservations.buffer_rules import filter_blocking
from app.modules.reservations.models import CalendarBlock
from app.shared.enums import CalendarBlockType

T0 = datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc)
T1 = datetime(2026, 6, 1, 11, 0, tzinfo=timezone.utc)


def _block(type_: CalendarBlockType, reservation_id: int | None) -> CalendarBlock:
    return CalendarBlock(
        environment_id=1,
        reservation_id=reservation_id,
        start_time=T0,
        end_time=T1,
        type=type_,
        priority="NORMAL",
    )


def test_admin_block_always_blocks():
    block = _block(CalendarBlockType.ADMIN_BLOCK, None)
    assert filter_blocking([block], exclude_reservation_id=5) == [block]


def test_foreign_buffer_blocks():
    block = _block(CalendarBlockType.BUFFER, reservation_id=9)
    assert filter_blocking([block], exclude_reservation_id=5) == [block]


def test_own_buffer_is_excluded():
    block = _block(CalendarBlockType.BUFFER, reservation_id=5)
    assert filter_blocking([block], exclude_reservation_id=5) == []


def test_buffer_blocks_when_no_exclusion():
    block = _block(CalendarBlockType.BUFFER, reservation_id=5)
    assert filter_blocking([block], exclude_reservation_id=None) == [block]
