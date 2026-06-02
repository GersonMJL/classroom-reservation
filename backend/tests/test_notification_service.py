"""Testes do NotificationService com repositório falso."""

import app.db.models  # noqa: F401

from app.modules.notifications.models import Notification
from app.modules.notifications.service import NotificationService
from app.shared.enums import NotificationType


class _FakeRepo:
    def __init__(self) -> None:
        self.added: list[Notification] = []
        self.saved: list[Notification] = []

    def add(self, notification: Notification) -> Notification:
        notification.id = len(self.added) + 1
        self.added.append(notification)
        return notification

    def get_for_user(self, *, notification_id, user_id):
        for n in self.added:
            if n.id == notification_id and n.user_id == user_id:
                return n
        return None

    def save(self, notification: Notification) -> Notification:
        self.saved.append(notification)
        return notification


def test_notify_persists_unread_notification():
    repo = _FakeRepo()
    service = NotificationService(repository=repo)

    result = service.notify(
        user_id=7,
        type=NotificationType.RESERVATION_APPROVED,
        title="Reserva aprovada",
        body="Sua reserva #3 foi aprovada.",
        related_entity_type="reservation",
        related_target_id=3,
    )

    assert result.user_id == 7
    assert result.read is False
    assert result.title == "Reserva aprovada"
    assert result.related_target_id == 3
    assert repo.added == [result]


def test_mark_read_sets_flag_and_saves():
    repo = _FakeRepo()
    service = NotificationService(repository=repo)
    created = service.notify(
        user_id=7,
        type=NotificationType.PENALTY_APPLIED,
        title="Penalidade",
        body="x",
    )

    updated = service.mark_read(notification_id=created.id, user_id=7)

    assert updated.read is True
    assert updated in repo.saved


def test_mark_read_returns_none_for_other_user():
    repo = _FakeRepo()
    service = NotificationService(repository=repo)
    created = service.notify(
        user_id=7, type=NotificationType.PENALTY_APPLIED, title="x", body="y"
    )

    assert service.mark_read(notification_id=created.id, user_id=99) is None
