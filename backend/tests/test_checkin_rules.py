"""Testes da regra pura de janela de tolerância de check-in."""

from datetime import datetime, timedelta, timezone

from app.modules.reservations.checkin_rules import checkin_window_expired

START = datetime(2026, 5, 30, 14, 0, tzinfo=timezone.utc)
TOLERANCE_MIN = 15


def test_checkin_at_start_is_allowed():
    assert checkin_window_expired(START, TOLERANCE_MIN, now=START) is False


def test_checkin_within_tolerance_is_allowed():
    now = START + timedelta(minutes=14)
    assert checkin_window_expired(START, TOLERANCE_MIN, now=now) is False


def test_checkin_exactly_at_deadline_is_allowed():
    now = START + timedelta(minutes=15)
    assert checkin_window_expired(START, TOLERANCE_MIN, now=now) is False


def test_checkin_after_deadline_is_expired():
    now = START + timedelta(minutes=16)
    assert checkin_window_expired(START, TOLERANCE_MIN, now=now) is True


def test_zero_tolerance_expires_right_after_start():
    now = START + timedelta(seconds=1)
    assert checkin_window_expired(START, 0, now=now) is True
