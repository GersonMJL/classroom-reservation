"""Auditoria do EnvironmentService com repo e audit falsos."""

import app.db.models  # noqa: F401

from app.modules.environments.models import Environment
from app.modules.environments.schemas import EnvironmentCreate, EnvironmentUpdate
from app.modules.environments.service import EnvironmentService
from app.shared.enums import AuditAction, EnvironmentCriticality, EnvironmentType


def _environment() -> Environment:
    return Environment(
        id=5,
        name="Lab A",
        type=EnvironmentType.LABORATORY,
        criticality=EnvironmentCriticality.CONTROLLED,
        capacity=20,
        location_id=2,
        operating_hours="07:00-22:00",
        requires_approval=True,
        buffer_before_min=0,
        buffer_after_min=0,
        noshow_tolerance_min=15,
        active=True,
    )


class _FakeRepo:
    def __init__(self, env: Environment) -> None:
        self._env = env
        self.deleted: list[Environment] = []

    def create(self, payload):
        return self._env

    def update(self, environment, payload):
        return environment

    def delete(self, environment):
        self.deleted.append(environment)


class _FakeAudit:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    def record(self, **kwargs):
        self.calls.append(kwargs)


def _payload_create() -> EnvironmentCreate:
    return EnvironmentCreate(
        name="Lab A",
        type=EnvironmentType.LABORATORY,
        criticality=EnvironmentCriticality.CONTROLLED,
        capacity=20,
        location_id=2,
        operating_hours="07:00-22:00",
    )


def test_create_records_audit():
    audit = _FakeAudit()
    service = EnvironmentService(repository=_FakeRepo(_environment()), audit=audit)
    service.create_environment(_payload_create(), performed_by=42)
    assert audit.calls[0]["action"] == AuditAction.CREATE
    assert audit.calls[0]["performed_by"] == 42
    assert audit.calls[0]["target_id"] == 5
    assert audit.calls[0]["after"]["name"] == "Lab A"


def test_update_records_before_and_after():
    audit = _FakeAudit()
    env = _environment()
    service = EnvironmentService(repository=_FakeRepo(env), audit=audit)
    service.update_environment(env, EnvironmentUpdate(capacity=30), performed_by=7)
    call = audit.calls[0]
    assert call["action"] == AuditAction.UPDATE
    assert call["before"]["capacity"] == 20
    assert call["performed_by"] == 7


def test_delete_records_audit():
    audit = _FakeAudit()
    env = _environment()
    service = EnvironmentService(repository=_FakeRepo(env), audit=audit)
    service.delete_environment(env, performed_by=9)
    call = audit.calls[0]
    assert call["action"] == AuditAction.DELETE
    assert call["target_id"] == 5
    assert call["before"]["name"] == "Lab A"
