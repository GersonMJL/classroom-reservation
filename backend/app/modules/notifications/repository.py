from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def list_for_user(
        self, *, user_id: int, only_unread: bool = False, limit: int = 100
    ) -> list[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if only_unread:
            stmt = stmt.where(Notification.read.is_(False))
        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def get_for_user(self, *, notification_id: int, user_id: int) -> Notification | None:
        stmt = (
            select(Notification)
            .where(Notification.id == notification_id)
            .where(Notification.user_id == user_id)
        )
        return self.db.execute(stmt).scalars().first()

    def count_unread(self, *, user_id: int) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.read.is_(False))
        )
        return int(self.db.execute(stmt).scalar_one())

    def save(self, notification: Notification) -> Notification:
        self.db.commit()
        self.db.refresh(notification)
        return notification
