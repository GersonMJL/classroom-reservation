# backend/app/modules/operations/incident_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.operations.models import Incident


class IncidentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        reservation_id: int | None = None,
    ) -> list[Incident]:
        query = select(Incident).order_by(Incident.reported_at.desc())
        if reservation_id is not None:
            query = query.where(Incident.reservation_id == reservation_id)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def add(self, incident: Incident) -> Incident:
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)
        return incident
