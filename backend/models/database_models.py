"""Compatibility module for legacy imports.

Prefer importing ORM models from `models.user_model` and `models.room_model`.
"""

from models.room_model import RoomModel
from models.user_model import UserModel

__all__ = ["UserModel", "RoomModel"]
