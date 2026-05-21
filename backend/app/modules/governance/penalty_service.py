from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.governance.models import Appeal, Penalty
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.users.models import User
from app.shared.enums import (
    AppealStatus,
    AuditAction,
    PenaltyStatus,
    PenaltyType,
)


class PenaltyService:
    NOSHOW_DURATION_DAYS = 7
    REPEAT_NOSHOW_THRESHOLD = 3
    REPEAT_NOSHOW_WINDOW_DAYS = 30
    REPEAT_BLOCK_DAYS = 30

    def __init__(self, repository: PenaltyRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list(self, **kwargs) -> list[Penalty]:
        return self.repository.list(**kwargs)

    def apply_no_show(self, *, user_id: int, reservation_id: int) -> Penalty:
        now = datetime.now(UTC)
        penalty = Penalty(
            user_id=user_id,
            reservation_id=reservation_id,
            type=PenaltyType.NO_SHOW,
            status=PenaltyStatus.APPLIED,
            description="No-show automático",
            duration_days=self.NOSHOW_DURATION_DAYS,
            start_date=now,
            end_date=now + timedelta(days=self.NOSHOW_DURATION_DAYS),
            applied_by=None,
        )
        saved = self.repository.add(penalty)
        self.audit.record(
            entity_type="penalty",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=user_id,
            after={"type": "NO_SHOW", "user_id": user_id},
        )

        count = self.repository.count_noshows_last_days(
            user_id=user_id,
            days=self.REPEAT_NOSHOW_WINDOW_DAYS,
            now=now,
        )
        if count >= self.REPEAT_NOSHOW_THRESHOLD:
            block = Penalty(
                user_id=user_id,
                reservation_id=reservation_id,
                type=PenaltyType.MISUSE,
                status=PenaltyStatus.APPLIED,
                description=(
                    f"Bloqueio por {self.REPEAT_NOSHOW_THRESHOLD} no-shows em "
                    f"{self.REPEAT_NOSHOW_WINDOW_DAYS} dias"
                ),
                duration_days=self.REPEAT_BLOCK_DAYS,
                start_date=now,
                end_date=now + timedelta(days=self.REPEAT_BLOCK_DAYS),
                applied_by=None,
            )
            self.repository.add(block)
            self.audit.record(
                entity_type="penalty",
                target_id=block.id,
                action=AuditAction.CREATE,
                performed_by=user_id,
                after={"type": "MISUSE", "user_id": user_id, "reason": "repeat_noshow"},
            )

        return saved

    def apply_manual(
        self,
        *,
        user_id: int,
        reservation_id: int,
        type: PenaltyType,
        description: str,
        duration_days: int | None,
        applied_by: User,
    ) -> Penalty:
        now = datetime.now(UTC)
        end = now + timedelta(days=duration_days) if duration_days else None
        penalty = Penalty(
            user_id=user_id,
            reservation_id=reservation_id,
            type=type,
            status=PenaltyStatus.APPLIED,
            description=description,
            duration_days=duration_days,
            start_date=now,
            end_date=end,
            applied_by=applied_by.id,
        )
        saved = self.repository.add(penalty)
        self.audit.record(
            entity_type="penalty",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=applied_by.id,
            after={"type": type.value, "user_id": user_id},
        )
        return saved

    def submit_appeal(self, *, penalty_id: int, justification: str, by: User) -> Appeal:
        penalty = self.repository.get(penalty_id)
        if penalty is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Penalidade não encontrada",
            )
        if penalty.user_id != by.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o usuário penalizado pode recorrer",
            )
        penalty.status = PenaltyStatus.UNDER_APPEAL
        self.repository.save(penalty)
        appeal = Appeal(
            penalty_id=penalty_id,
            status=AppealStatus.SUBMITTED,
            resolution_notes=justification,
        )
        return self.repository.add_appeal(appeal)

    def resolve_appeal(
        self,
        *,
        appeal_id: int,
        approve: bool,
        resolution_notes: str,
        by: User,
    ) -> Appeal:
        appeal = self.repository.get_appeal(appeal_id)
        if appeal is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurso não encontrado",
            )
        appeal.status = AppealStatus.APPROVED if approve else AppealStatus.REJECTED
        appeal.resolution_notes = resolution_notes
        penalty = self.repository.get(appeal.penalty_id)
        if penalty is not None:
            penalty.status = PenaltyStatus.WAIVED if approve else PenaltyStatus.APPLIED
            self.repository.save(penalty)
        self.repository.db.add(appeal)
        self.repository.db.commit()
        self.repository.db.refresh(appeal)
        self.audit.record(
            entity_type="appeal",
            target_id=appeal_id,
            action=AuditAction.APPROVE if approve else AuditAction.REJECT,
            performed_by=by.id,
            after={"status": appeal.status},
        )
        return appeal
