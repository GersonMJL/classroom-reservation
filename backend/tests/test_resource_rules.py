"""Testes da regra pura de vínculo fixo/móvel de recurso."""

import pytest
from fastapi import HTTPException

from app.modules.resources.resource_rules import assert_attachment_consistency


def test_fixed_requires_environment():
    with pytest.raises(HTTPException) as exc:
        assert_attachment_consistency(attachment_type="FIXED", environment_id=None)
    assert exc.value.status_code == 422


def test_fixed_with_environment_ok():
    assert_attachment_consistency(attachment_type="FIXED", environment_id=3)


def test_mobile_forbids_environment():
    with pytest.raises(HTTPException) as exc:
        assert_attachment_consistency(attachment_type="MOBILE", environment_id=3)
    assert exc.value.status_code == 422


def test_mobile_without_environment_ok():
    assert_attachment_consistency(attachment_type="MOBILE", environment_id=None)
