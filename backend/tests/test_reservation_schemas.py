"""Testes unitários para validações de horário nos schemas de reserva."""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.modules.reservations.schemas import (
    CompositeItemCreate,
    ReservationBase,
    ReservationUpdate,
)
from app.shared.enums import ReservationPurpose


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _utc(year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    """Cria um datetime UTC timezone-aware. Horário de Brasília = UTC-3."""
    return datetime(year, month, day, hour, minute, tzinfo=timezone.utc)


def _base_kwargs(**overrides) -> dict:
    """Kwargs válidos para ReservationBase (09:00–13:00 BRT = 12:00–16:00 UTC)."""
    return {
        "environment_id": 1,
        "requester_id": 1,
        "responsible_id": 1,
        "start_time": _utc(2024, 6, 15, 12, 0),  # 09:00 BRT
        "end_time": _utc(2024, 6, 15, 16, 0),  # 13:00 BRT
        "purpose": ReservationPurpose.CLASS,
        "participant_count": 30,
        **overrides,
    }


def _composite_kwargs(**overrides) -> dict:
    """Kwargs válidos para CompositeItemCreate."""
    return {
        "environment_id": 1,
        "start_time": _utc(2024, 6, 15, 12, 0),  # 09:00 BRT
        "end_time": _utc(2024, 6, 15, 16, 0),  # 13:00 BRT
        "participant_count": 30,
        "purpose": ReservationPurpose.MEETING,
        **overrides,
    }


# ---------------------------------------------------------------------------
# ReservationBase — horário válido
# ---------------------------------------------------------------------------


def test_reservation_base_valid_window():
    """09:00–13:00 BRT: dentro do horário de funcionamento."""
    ReservationBase(**_base_kwargs())  # não deve lançar


def test_reservation_base_boundary_start_7am():
    """Início exatamente às 07:00 BRT (10:00 UTC) é válido."""
    ReservationBase(
        **_base_kwargs(
            start_time=_utc(2024, 6, 15, 10, 0),  # 07:00 BRT
            end_time=_utc(2024, 6, 15, 12, 0),  # 09:00 BRT
        )
    )


def test_reservation_base_boundary_end_22pm():
    """Término exatamente às 22:00 BRT (01:00 UTC do dia seguinte) é válido."""
    ReservationBase(
        **_base_kwargs(
            start_time=_utc(2024, 6, 15, 16, 0),  # 13:00 BRT
            end_time=_utc(2024, 6, 16, 1, 0),  # 22:00 BRT
        )
    )


# ---------------------------------------------------------------------------
# ReservationBase — horário inválido
# ---------------------------------------------------------------------------


def test_reservation_base_start_before_7am_raises():
    """Início antes das 07:00 BRT deve ser rejeitado."""
    with pytest.raises(ValidationError, match="07:00"):
        ReservationBase(
            **_base_kwargs(
                start_time=_utc(2024, 6, 15, 9, 59),  # 06:59 BRT
                end_time=_utc(2024, 6, 15, 14, 0),  # 11:00 BRT
            )
        )


def test_reservation_base_end_after_22pm_raises():
    """Término após as 22:00 BRT deve ser rejeitado."""
    with pytest.raises(ValidationError, match="22:00"):
        ReservationBase(
            **_base_kwargs(
                start_time=_utc(2024, 6, 15, 14, 0),  # 11:00 BRT
                end_time=_utc(2024, 6, 16, 1, 1),  # 22:01 BRT
            )
        )


def test_reservation_base_midnight_start_raises():
    """Início às 00:00 BRT (03:00 UTC) deve ser rejeitado."""
    with pytest.raises(ValidationError, match="07:00"):
        ReservationBase(
            **_base_kwargs(
                start_time=_utc(2024, 6, 15, 3, 0),  # 00:00 BRT
                end_time=_utc(2024, 6, 15, 12, 0),  # 09:00 BRT
            )
        )


# ---------------------------------------------------------------------------
# ReservationUpdate — validação de campos parciais
# ---------------------------------------------------------------------------


def test_reservation_update_start_before_7am_raises():
    """Atualização de start_time para antes das 07:00 deve ser rejeitada."""
    with pytest.raises(ValidationError, match="07:00"):
        ReservationUpdate(start_time=_utc(2024, 6, 15, 9, 0))  # 06:00 BRT


def test_reservation_update_end_after_22pm_raises():
    """Atualização de end_time para depois das 22:00 deve ser rejeitada."""
    with pytest.raises(ValidationError, match="22:00"):
        ReservationUpdate(end_time=_utc(2024, 6, 16, 1, 30))  # 22:30 BRT


def test_reservation_update_valid_times():
    """Atualização com horários dentro do funcionamento é válida."""
    ReservationUpdate(
        start_time=_utc(2024, 6, 15, 12, 0),  # 09:00 BRT
        end_time=_utc(2024, 6, 15, 18, 0),  # 15:00 BRT
    )


def test_reservation_update_only_start_valid():
    """Atualização de só start_time dentro do horário é válida."""
    ReservationUpdate(start_time=_utc(2024, 6, 15, 14, 0))  # 11:00 BRT


# ---------------------------------------------------------------------------
# CompositeItemCreate
# ---------------------------------------------------------------------------


def test_composite_item_valid():
    """Horário válido em CompositeItemCreate."""
    CompositeItemCreate(**_composite_kwargs())


def test_composite_item_start_too_early_raises():
    """Início antes das 07:00 BRT em CompositeItemCreate deve ser rejeitado."""
    with pytest.raises(ValidationError, match="07:00"):
        CompositeItemCreate(
            **_composite_kwargs(
                start_time=_utc(2024, 6, 15, 9, 30),  # 06:30 BRT
                end_time=_utc(2024, 6, 15, 14, 0),  # 11:00 BRT
            )
        )


def test_composite_item_end_too_late_raises():
    """Término após as 22:00 BRT em CompositeItemCreate deve ser rejeitado."""
    with pytest.raises(ValidationError, match="22:00"):
        CompositeItemCreate(
            **_composite_kwargs(
                start_time=_utc(2024, 6, 15, 16, 0),  # 13:00 BRT
                end_time=_utc(2024, 6, 16, 1, 15),  # 22:15 BRT
            )
        )


# ---------------------------------------------------------------------------
# purpose — enum enforcement
# ---------------------------------------------------------------------------


def test_reservation_base_accepts_canonical_purpose():
    """Cada valor canônico de ReservationPurpose é aceito."""
    for purpose in ReservationPurpose:
        ReservationBase(**_base_kwargs(purpose=purpose))  # não deve lançar


def test_reservation_base_rejects_free_text_purpose():
    """Texto livre fora do enum é rejeitado."""
    with pytest.raises(ValidationError):
        ReservationBase(**_base_kwargs(purpose="Aula de Banco de Dados"))


def test_composite_item_rejects_free_text_purpose():
    """Texto livre fora do enum é rejeitado no item composto."""
    with pytest.raises(ValidationError):
        CompositeItemCreate(**_composite_kwargs(purpose="qualquer coisa"))


def test_reservation_update_rejects_free_text_purpose():
    """PATCH com finalidade de texto livre é rejeitado."""
    with pytest.raises(ValidationError):
        ReservationUpdate(purpose="Reunião de Equipe")
