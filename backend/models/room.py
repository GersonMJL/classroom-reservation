from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime


class RoomBase(BaseModel):
    room_id: str = Field(..., min_length=1, description="Unique room identifier")
    room_type: str = Field(..., min_length=1, description="Type of room")
    location: str = Field(..., min_length=1, description="Room location")
    capacity: int = Field(..., gt=0, description="Room capacity")
    accessibility: bool = Field(default=False, description="Accessibility features")
    allowed_purposes: List[str] = Field(
        ..., min_items=1, description="Allowed purposes for the room"
    )


class RoomCreate(RoomBase):
    """Schema for creating a new room"""

    pass


class RoomUpdate(BaseModel):
    """Schema for updating a room"""

    room_type: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    accessibility: Optional[bool] = None
    allowed_purposes: Optional[List[str]] = None
    is_active: Optional[bool] = None


class Room(RoomBase):
    """Schema for room response"""

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
