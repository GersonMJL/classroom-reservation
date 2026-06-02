"""Testes do conteúdo puro das notificações de penalidade/recurso."""

from app.modules.governance.penalty_notifications import (
    appeal_resolved_notification,
    penalty_applied_notification,
)
from app.shared.enums import NotificationType, PenaltyType


def test_penalty_applied_notification():
    p = penalty_applied_notification(penalty_type=PenaltyType.NO_SHOW, penalty_id=4)
    assert p["type"] == NotificationType.PENALTY_APPLIED
    assert "4" in p["body"]


def test_appeal_resolved_approved():
    p = appeal_resolved_notification(approved=True, appeal_id=2)
    assert p["type"] == NotificationType.APPEAL_RESOLVED
    assert "aprovado" in p["body"].lower()


def test_appeal_resolved_rejected():
    p = appeal_resolved_notification(approved=False, appeal_id=2)
    assert "rejeitado" in p["body"].lower()
