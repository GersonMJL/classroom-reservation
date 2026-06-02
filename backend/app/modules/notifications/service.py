from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NotificationRepository
from app.shared.enums import NotificationType


class NotificationService:
    def __init__(self, repository: NotificationRepository) -> None:
        self.repository = repository

    def notify(
        self,
        *,
        user_id: int,
        type: NotificationType,
        title: str,
        body: str,
        related_entity_type: str | None = None,
        related_target_id: int | None = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            read=False,
            related_entity_type=related_entity_type,
            related_target_id=related_target_id,
            created_at=datetime.now(UTC),
        )
        return self.repository.add(notification)

    def list_for_user(
        self, *, user_id: int, only_unread: bool = False
    ) -> list[Notification]:
        return self.repository.list_for_user(user_id=user_id, only_unread=only_unread)

    def count_unread(self, *, user_id: int) -> int:
        return self.repository.count_unread(user_id=user_id)

    def mark_read(self, *, notification_id: int, user_id: int) -> Notification | None:
        notification = self.repository.get_for_user(
            notification_id=notification_id, user_id=user_id
        )
        if notification is None:
            return None
        notification.read = True
        return self.repository.save(notification)


def build_notification_service(db: Session) -> NotificationService:
    return NotificationService(repository=NotificationRepository(db=db))
