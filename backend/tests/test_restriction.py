"""Testes da regra pura de restrição e do RestrictionGuard."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

import app.db.models  # noqa: F401 – registra todos os mappers SQLAlchemy
from app.modules.governance.models import Penalty
from app.modules.governance.restriction import RestrictionGuard, active_restriction
from app.shared.enums import PenaltyStatus, PenaltyType

NOW = datetime(2026, 5, 30, 12, 0, tzinfo=timezone.utc)


def _penalty(*, status: PenaltyStatus, end_offset_days: int | None) -> Penalty:
    end = None if end_offset_days is None else NOW + timedelta(days=end_offset_days)
    return Penalty(
        user_id=1,
        reservation_id=1,
        type=PenaltyType.NO_SHOW,
        status=status,
        description="x",
        duration_days=None,
        start_date=NOW,
        end_date=end,
        applied_by=None,
    )


def test_no_penalties_means_no_restriction():
    assert active_restriction([], NOW) is None


def test_applied_penalty_with_future_end_restricts():
    p = _penalty(status=PenaltyStatus.APPLIED, end_offset_days=7)
    assert active_restriction([p], NOW) is p


def test_under_appeal_penalty_with_future_end_restricts():
    p = _penalty(status=PenaltyStatus.UNDER_APPEAL, end_offset_days=30)
    assert active_restriction([p], NOW) is p


def test_expired_penalty_does_not_restrict():
    p = _penalty(status=PenaltyStatus.APPLIED, end_offset_days=-1)
    assert active_restriction([p], NOW) is None


def test_waived_penalty_does_not_restrict():
    p = _penalty(status=PenaltyStatus.WAIVED, end_offset_days=7)
    assert active_restriction([p], NOW) is None


def test_penalty_without_end_date_does_not_restrict():
    p = _penalty(status=PenaltyStatus.APPLIED, end_offset_days=None)
    assert active_restriction([p], NOW) is None


class _FakeRepo:
    def __init__(self, penalties):
        self._penalties = penalties

    def list_active_for_user(self, *, user_id, now):
        return self._penalties


def test_guard_allows_when_no_restriction():
    guard = RestrictionGuard(repository=_FakeRepo([]))
    guard.assert_allowed(user_id=1, now=NOW)  # não deve lançar


def test_guard_blocks_when_restricted():
    p = _penalty(status=PenaltyStatus.APPLIED, end_offset_days=7)
    guard = RestrictionGuard(repository=_FakeRepo([p]))
    with pytest.raises(HTTPException) as exc:
        guard.assert_allowed(user_id=1, now=NOW)
    assert exc.value.status_code == 403
    assert "restrição" in exc.value.detail.lower()


def test_penalty_ending_exactly_now_does_not_restrict():
    p = _penalty(status=PenaltyStatus.APPLIED, end_offset_days=0)
    assert active_restriction([p], NOW) is None
