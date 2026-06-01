"""Serialização de entidades ORM para o estado before/after da auditoria."""

from typing import Any

from pydantic import BaseModel

from app.db.base import Base


def snapshot(obj: Base, schema: type[BaseModel]) -> dict[str, Any]:
    """Serializa ``obj`` usando o schema Pydantic ``*Read`` correspondente."""
    return schema.model_validate(obj).model_dump(mode="json")
