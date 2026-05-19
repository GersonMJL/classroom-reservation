from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.organizational_units.models import OrganizationalUnit
from app.modules.organizational_units.schemas import (
    OrganizationalUnitCreate,
    OrganizationalUnitUpdate,
)


class OrganizationalUnitRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[OrganizationalUnit]:
        query = select(OrganizationalUnit)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, unit_id: int) -> OrganizationalUnit | None:
        return self.db.get(OrganizationalUnit, unit_id)

    def create(self, payload: OrganizationalUnitCreate) -> OrganizationalUnit:
        unit = OrganizationalUnit(**payload.model_dump())
        self.db.add(unit)
        self.db.commit()
        self.db.refresh(unit)
        return unit

    def update(
        self, unit_id: int, payload: OrganizationalUnitUpdate
    ) -> OrganizationalUnit | None:
        unit = self.db.get(OrganizationalUnit, unit_id)
        if unit is None:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(unit, field, value)
        self.db.commit()
        self.db.refresh(unit)
        return unit

    def delete(self, unit_id: int) -> bool:
        unit = self.db.get(OrganizationalUnit, unit_id)
        if unit is None:
            return False
        self.db.delete(unit)
        self.db.commit()
        return True
