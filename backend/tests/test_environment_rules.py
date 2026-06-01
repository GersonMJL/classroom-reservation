"""Testes das regras puras de ambiente (código único e capacidade)."""

import pytest
from fastapi import HTTPException

from app.modules.environments.environment_rules import (
    assert_capacity_not_below_confirmed,
    assert_unique_code,
)


def test_unique_code_ok_when_no_clash():
    assert_unique_code(existing_id=None)  # não lança


def test_unique_code_raises_on_clash():
    with pytest.raises(HTTPException) as exc:
        assert_unique_code(existing_id=9)
    assert exc.value.status_code == 409


def test_capacity_ok_when_above_confirmed():
    assert_capacity_not_below_confirmed(new_capacity=30, max_confirmed=20)


def test_capacity_ok_when_equal():
    assert_capacity_not_below_confirmed(new_capacity=20, max_confirmed=20)


def test_capacity_raises_when_below_confirmed():
    with pytest.raises(HTTPException) as exc:
        assert_capacity_not_below_confirmed(new_capacity=10, max_confirmed=20)
    assert exc.value.status_code == 409
    assert "capacidade" in exc.value.detail.lower()
