"""Testes do construtor puro de CSV de auditoria."""

from datetime import datetime, timezone

from app.modules.audit.export import build_audit_csv


class _Rec:
    def __init__(self, id, entity_type, target_id, action, performed_by, performed_at,
                 before_state, after_state):
        self.id = id
        self.entity_type = entity_type
        self.target_id = target_id
        self.action = action
        self.performed_by = performed_by
        self.performed_at = performed_at
        self.before_state = before_state
        self.after_state = after_state


def _rec() -> "_Rec":
    return _Rec(
        id=1,
        entity_type="reservation",
        target_id=7,
        action="CREATE",
        performed_by=3,
        performed_at=datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
        before_state=None,
        after_state='{"status": "APPROVED"}',
    )


def test_csv_has_header_and_row():
    csv_text = build_audit_csv([_rec()])
    lines = csv_text.strip().splitlines()
    assert lines[0] == (
        "id,entity_type,target_id,action,performed_by,performed_at,"
        "before_state,after_state"
    )
    assert "reservation" in lines[1]
    assert "7" in lines[1]


def test_empty_records_yields_header_only():
    csv_text = build_audit_csv([])
    assert csv_text.strip().splitlines() == [
        "id,entity_type,target_id,action,performed_by,performed_at,"
        "before_state,after_state"
    ]
