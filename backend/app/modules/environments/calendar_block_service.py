from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.environments.calendar_block_repository import CalendarBlockRepository
from app.modules.environments.schemas import CalendarBlockCreate, CalendarBlockUpdate
from app.modules.reservations import buffer_manager
from app.modules.reservations.models import CalendarBlock
from app.shared.enums import AuditAction, CalendarBlockType


class CalendarBlockService:
    SYSTEM_TYPES = {CalendarBlockType.BUFFER}

    def __init__(self, repository: CalendarBlockRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list(self, **kwargs) -> list[CalendarBlock]:
        return self.repository.list(**kwargs)

    def get(self, id: int) -> CalendarBlock | None:
        return self.repository.get_by_id(id)

    def create(self, payload: CalendarBlockCreate) -> CalendarBlock:
        self._reject_system_type(payload.type)
        block = CalendarBlock(**payload.model_dump())
        return self.repository.add(block)

    def update(
        self, block: CalendarBlock, payload: CalendarBlockUpdate
    ) -> CalendarBlock:
        self._reject_system_type(CalendarBlockType(block.type))
        data = payload.model_dump(exclude_unset=True)
        if "type" in data:
            self._reject_system_type(data["type"])
        for key, value in data.items():
            setattr(block, key, value)
        return self.repository.save(block)

    def delete(self, block: CalendarBlock) -> None:
        self._reject_system_type(CalendarBlockType(block.type))
        self.repository.delete(block)

    def release_early(
        self, block: CalendarBlock, *, released_by: int, notes: str | None
    ) -> CalendarBlock:
        if CalendarBlockType(block.type) is not CalendarBlockType.BUFFER:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Somente buffers podem ser liberados antecipadamente",
            )
        before_end = block.end_time
        buffer_manager.release_buffer_early(
            buffer_block=block,
            session=self.repository.db,
            released_by_user_id=released_by,
            notes=notes,
        )
        saved = self.repository.save(block)
        self.audit.record(
            entity_type="calendar_block",
            target_id=saved.id,
            action=AuditAction.UPDATE,
            performed_by=released_by,
            before={"end_time": before_end.isoformat()},
            after={
                "end_time": saved.end_time.isoformat(),
                "released_by": released_by,
                "notes": notes,
            },
        )
        return saved

    def _reject_system_type(self, type_: CalendarBlockType) -> None:
        if type_ in self.SYSTEM_TYPES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Bloqueios gerados pelo sistema (BUFFER) não podem ser "
                    "editados manualmente (regra 2.2)"
                ),
            )
