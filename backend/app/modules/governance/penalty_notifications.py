"""Conteúdo (puro) das notificações de penalidade e recurso (UC08)."""

from typing import Any

from app.shared.enums import NotificationType, PenaltyType


def penalty_applied_notification(
    *, penalty_type: PenaltyType, penalty_id: int
) -> dict[str, Any]:
    return {
        "type": NotificationType.PENALTY_APPLIED,
        "title": "Penalidade aplicada",
        "body": (
            f"Uma penalidade do tipo {penalty_type.value} (#{penalty_id}) "
            f"foi aplicada ao seu perfil."
        ),
    }


def appeal_resolved_notification(*, approved: bool, appeal_id: int) -> dict[str, Any]:
    resultado = "aprovado" if approved else "rejeitado"
    return {
        "type": NotificationType.APPEAL_RESOLVED,
        "title": "Recurso analisado",
        "body": f"Seu recurso #{appeal_id} foi {resultado}.",
    }
