from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import NotificationType


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: NotificationType
    title: str
    body: str
    read: bool
    related_entity_type: str | None
    related_target_id: int | None
    created_at: datetime


class UnreadCount(BaseModel):
    unread: int
