from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime


class RoomBase(BaseModel):
    room_id: str = Field(..., min_length=1, description="Unique room identifier")
    room_type: str = Field(..., min_length=1, description="Type of room")
    location: str = Field(..., min_length=1, description="Room location")
    capacity: int = Field(..., gt=0, description="Room capacity")
    accessibility: bool = Field(default=False, description="Accessibility features")
    allowed_purposes: list[str] = Field(
        ..., min_length=1, description="Allowed purposes for the room"
    )
    criticality: Literal["common", "controlled", "restricted"] = Field(
        default="common",
        description="Criticality classification for this environment",
    )
    supervisor_user_id: Optional[int] = Field(
        default=None,
        gt=0,
        description="Required when room_type is laboratory",
    )
    type_attributes: dict[str, Any] = Field(
        default_factory=dict,
        description="Type-specific environment attributes",
    )

    @model_validator(mode="after")
    def validate_laboratory_supervisor(self):
        if self.room_type == "laboratory" and self.supervisor_user_id is None:
            raise ValueError(
                "Ambientes de laboratório exigem um supervisor técnico"
            )
        return self


class RoomResourceItemCreate(BaseModel):
    resource_id: int = Field(..., gt=0, description="ID of the linked resource")
    quantity: int = Field(default=1, ge=1, description="Reserved resource quantity")


class RoomResourceItem(BaseModel):
    id: int
    resource_id: int
    resource_code: str
    name: str
    resource_type: str
    quantity: int


class RoomResourcesMixin(BaseModel):
    fixed_resources: list[RoomResourceItemCreate] = Field(default_factory=list)
    optional_resources: list[RoomResourceItemCreate] = Field(default_factory=list)


class RoomCreate(RoomBase, RoomResourcesMixin):
    """Schema for creating a new room"""

    pass


class RoomUpdate(BaseModel):
    """Schema for updating a room"""

    room_id: Optional[str] = None
    room_type: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    accessibility: Optional[bool] = None
    allowed_purposes: Optional[list[str]] = None
    criticality: Optional[Literal["common", "controlled", "restricted"]] = None
    supervisor_user_id: Optional[int] = Field(default=None, gt=0)
    type_attributes: Optional[dict[str, Any]] = None
    fixed_resources: Optional[list[RoomResourceItemCreate]] = None
    optional_resources: Optional[list[RoomResourceItemCreate]] = None
    is_active: Optional[bool] = None


class Room(RoomBase):
    """Schema for room response"""

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    fixed_resources: list[RoomResourceItem] = Field(default_factory=list)
    optional_resources: list[RoomResourceItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
