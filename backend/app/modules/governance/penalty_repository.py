from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.governance.models import Appeal, Penalty
from app.shared.enums import PenaltyStatus, PenaltyType


class PenaltyRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: int | None = None,
    ) -> list[Penalty]:
        query = select(Penalty).order_by(Penalty.id.desc())
        if user_id is not None:
            query = query.where(Penalty.user_id == user_id)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get(self, id: int) -> Penalty | None:
        return self.db.get(Penalty, id)

    def add(self, penalty: Penalty) -> Penalty:
        self.db.add(penalty)
        self.db.commit()
        self.db.refresh(penalty)
        return penalty

    def save(self, penalty: Penalty) -> Penalty:
        self.db.add(penalty)
        self.db.commit()
        self.db.refresh(penalty)
        return penalty

    def count_noshows_last_days(self, *, user_id: int, days: int, now: datetime) -> int:
        since = now - timedelta(days=days)
        query = (
            select(Penalty)
            .where(Penalty.user_id == user_id)
            .where(Penalty.type == PenaltyType.NO_SHOW)
            .where(Penalty.status.in_([PenaltyStatus.APPLIED, PenaltyStatus.PENDING]))
            .where(Penalty.start_date >= since)
        )
        return len(list(self.db.execute(query).scalars().all()))

    def get_appeal(self, id: int) -> Appeal | None:
        return self.db.get(Appeal, id)

    def add_appeal(self, appeal: Appeal) -> Appeal:
        self.db.add(appeal)
        self.db.commit()
        self.db.refresh(appeal)
        return appeal
