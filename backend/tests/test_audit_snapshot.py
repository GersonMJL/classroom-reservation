"""Teste do helper de snapshot de auditoria."""

import app.db.models  # noqa: F401 – registra mappers

from app.modules.audit.snapshot import snapshot
from app.modules.environments.models import Environment
from app.modules.environments.schemas import EnvironmentRead
from app.shared.enums import EnvironmentCriticality, EnvironmentType


def _environment() -> Environment:
    return Environment(
        id=3,
        name="Sala 101",
        type=EnvironmentType.CLASSROOM,
        criticality=EnvironmentCriticality.COMMON,
        capacity=40,
        location_id=1,
        operating_hours="08:00-18:00",
        requires_approval=False,
        buffer_before_min=10,
        buffer_after_min=10,
        noshow_tolerance_min=15,
        active=True,
    )


def test_snapshot_serializes_via_read_schema():
    data = snapshot(_environment(), EnvironmentRead)
    assert data["id"] == 3
    assert data["name"] == "Sala 101"
    assert data["criticality"] == "COMMON"
    assert data["buffer_before_min"] == 10


def test_snapshot_is_json_serializable():
    import json

    data = snapshot(_environment(), EnvironmentRead)
    json.dumps(data)  # não deve lançar
