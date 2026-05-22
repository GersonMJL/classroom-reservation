from fastapi import HTTPException, status

from app.modules.environments.calendar_block_repository import CalendarBlockRepository
from app.modules.environments.schemas import CalendarBlockCreate, CalendarBlockUpdate
from app.modules.reservations.models import CalendarBlock
from app.shared.enums import CalendarBlockType


class CalendarBlockService:
    SYSTEM_TYPES = {CalendarBlockType.BUFFER}

    def __init__(self, repository: CalendarBlockRepository) -> None:
        self.repository = repository

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

    def _reject_system_type(self, type_: CalendarBlockType) -> None:
        if type_ in self.SYSTEM_TYPES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Bloqueios gerados pelo sistema (BUFFER) não podem ser "
                    "editados manualmente (regra 2.2)"
                ),
            )
