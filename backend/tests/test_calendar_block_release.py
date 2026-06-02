"""Testes de liberação antecipada de buffer com auditoria."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

import app.db.models  # noqa: F401

from app.modules.environments.calendar_block_service import CalendarBlockService
from app.modules.reservations.models import CalendarBlock
from app.shared.enums import AuditAction, CalendarBlockType


class _FakeSession:
    def flush(self) -> None:
        pass


class _FakeRepo:
    def __init__(self) -> None:
        self.db = _FakeSession()
        self.saved: list[CalendarBlock] = []

    def save(self, block: CalendarBlock) -> CalendarBlock:
        self.saved.append(block)
        return block


class _FakeAudit:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    def record(self, **kwargs) -> None:
        self.calls.append(kwargs)


def _buffer_now() -> CalendarBlock:
    now = datetime.now(timezone.utc)
    return CalendarBlock(
        id=1,
        environment_id=1,
        reservation_id=2,
        start_time=now - timedelta(hours=1),
        end_time=now + timedelta(hours=1),
        type=CalendarBlockType.BUFFER,
        priority="NORMAL",
    )


def test_release_early_shortens_and_audits():
    block = _buffer_now()
    repo, audit = _FakeRepo(), _FakeAudit()
    service = CalendarBlockService(repository=repo, audit=audit)

    result = service.release_early(block, released_by=3, notes="Limpeza concluída")

    now = datetime.now(timezone.utc)
    assert result.end_time <= now + timedelta(seconds=2)
    assert audit.calls[0]["action"] == AuditAction.UPDATE
    assert audit.calls[0]["performed_by"] == 3
    assert audit.calls[0]["after"]["notes"] == "Limpeza concluída"


def test_release_early_rejects_non_buffer():
    now = datetime.now(timezone.utc)
    block = CalendarBlock(
        id=1,
        environment_id=1,
        start_time=now - timedelta(hours=1),
        end_time=now + timedelta(hours=1),
        type=CalendarBlockType.ADMIN_BLOCK,
        priority="NORMAL",
    )
    service = CalendarBlockService(repository=_FakeRepo(), audit=_FakeAudit())

    with pytest.raises(HTTPException) as exc:
        service.release_early(block, released_by=3, notes=None)
    assert exc.value.status_code == 422
