"""Testes do conteúdo puro de notificação de decisão de reserva."""

from app.modules.reservations.approval_notifications import decision_notification
from app.shared.enums import NotificationType


def test_approved_notification():
    payload = decision_notification(approved=True, reservation_id=12)
    assert payload["type"] == NotificationType.RESERVATION_APPROVED
    assert "12" in payload["body"]
    assert payload["title"] == "Reserva aprovada"


def test_rejected_notification():
    payload = decision_notification(approved=False, reservation_id=5)
    assert payload["type"] == NotificationType.RESERVATION_REJECTED
    assert "5" in payload["body"]
    assert payload["title"] == "Reserva rejeitada"
