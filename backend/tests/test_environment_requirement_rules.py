"""Testes das regras puras de requisito de ambiente."""

import pytest
from fastapi import HTTPException


def _raise_if_duplicate(exists: bool) -> None:
    if exists:
        raise HTTPException(status_code=409, detail="Qualificação já exigida neste ambiente")


def test_no_raise_when_not_duplicate():
    _raise_if_duplicate(False)  # não lança


def test_raises_409_when_duplicate():
    with pytest.raises(HTTPException) as exc:
        _raise_if_duplicate(True)
    assert exc.value.status_code == 409
    assert "já exigida" in exc.value.detail
