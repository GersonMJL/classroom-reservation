from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.reservations.models import CalendarBlock


class CalendarBlockRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        environment_id: int | None = None,
    ) -> list[CalendarBlock]:
        query = select(CalendarBlock).order_by(CalendarBlock.start_time)
        if environment_id is not None:
            query = query.where(CalendarBlock.environment_id == environment_id)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, id: int) -> CalendarBlock | None:
        return self.db.get(CalendarBlock, id)

    def add(self, block: CalendarBlock) -> CalendarBlock:
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        return block

    def save(self, block: CalendarBlock) -> CalendarBlock:
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        return block

    def delete(self, block: CalendarBlock) -> None:
        self.db.delete(block)
        self.db.commit()
