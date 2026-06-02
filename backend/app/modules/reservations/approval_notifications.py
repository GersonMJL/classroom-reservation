"""Conteúdo (puro) das notificações de decisão de reserva (UC04)."""

from typing import Any

from app.shared.enums import NotificationType


def decision_notification(*, approved: bool, reservation_id: int) -> dict[str, Any]:
    if approved:
        return {
            "type": NotificationType.RESERVATION_APPROVED,
            "title": "Reserva aprovada",
            "body": f"Sua reserva #{reservation_id} foi aprovada.",
        }
    return {
        "type": NotificationType.RESERVATION_REJECTED,
        "title": "Reserva rejeitada",
        "body": f"Sua reserva #{reservation_id} foi rejeitada.",
    }
