from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import AuditAction


class AuditRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    target_id: int
    action: AuditAction
    performed_by: int
    performed_at: datetime
    before_state: str | None = None
    after_state: str | None = None
