"""Serialização de registros de auditoria para CSV (UC09 A1)."""

import csv
import io
from collections.abc import Iterable

_HEADER = [
    "id",
    "entity_type",
    "target_id",
    "action",
    "performed_by",
    "performed_at",
    "before_state",
    "after_state",
]


def build_audit_csv(records: Iterable) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(_HEADER)
    for r in records:
        writer.writerow(
            [
                r.id,
                r.entity_type,
                r.target_id,
                r.action,
                r.performed_by,
                r.performed_at.isoformat(),
                r.before_state or "",
                r.after_state or "",
            ]
        )
    return buffer.getvalue()
