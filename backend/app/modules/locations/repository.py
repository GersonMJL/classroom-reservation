from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.locations.models import Localizacao


class LocationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[Localizacao]:
        query = select(Localizacao)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, location_id: int) -> Localizacao | None:
        return self.db.get(Localizacao, location_id)
