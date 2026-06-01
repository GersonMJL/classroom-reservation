from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.notifications.schemas import NotificationRead, UnreadCount
from app.modules.notifications.service import (
    NotificationService,
    build_notification_service,
)
from app.modules.users.models import User

router = APIRouter(prefix="/api/v1/notificacoes", tags=["notifications"])


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return build_notification_service(db)


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    only_unread: bool = False,
    service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user),
) -> list[Any]:
    return service.list_for_user(user_id=current_user.id, only_unread=only_unread)


@router.get("/contagem", response_model=UnreadCount)
def unread_count(
    service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return UnreadCount(unread=service.count_unread(user_id=current_user.id))


@router.post("/{notification_id}/lida", response_model=NotificationRead)
def mark_read(
    notification_id: int,
    service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    updated = service.mark_read(
        notification_id=notification_id, user_id=current_user.id
    )
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notificação não encontrada"
        )
    return updated
