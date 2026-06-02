"""Testes da função pura de verificação de qualificações."""

import pytest
from fastapi import HTTPException

from app.modules.qualifications.qualification_rules import assert_qualifications_met


def test_passes_when_no_requirements():
    assert_qualifications_met(required_ids=[], held_ids=[])  # não lança


def test_passes_when_all_held():
    assert_qualifications_met(required_ids=[1, 2], held_ids=[1, 2, 3])  # não lança


def test_passes_when_superset_held():
    assert_qualifications_met(required_ids=[2], held_ids=[1, 2, 3])  # não lança


def test_raises_422_with_missing_ids():
    with pytest.raises(HTTPException) as exc:
        assert_qualifications_met(required_ids=[1, 2, 3], held_ids=[1])
    assert exc.value.status_code == 422
    assert "2" in exc.value.detail
    assert "3" in exc.value.detail


def test_raises_422_when_held_empty():
    with pytest.raises(HTTPException) as exc:
        assert_qualifications_met(required_ids=[5], held_ids=[])
    assert exc.value.status_code == 422
    assert "5" in exc.value.detail
