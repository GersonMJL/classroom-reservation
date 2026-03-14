from typing import Any

from core.jwt_bearer import get_current_user, get_current_user_with_roles
from core.database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.room_model import RoomModel
from schemas.room import (
    Room,
    RoomCreate,
    RoomResourceItem,
    RoomResourceItemCreate,
    RoomUpdate,
)
from repositories.room_repository import RoomRepository
from repositories.purpose_repository import PurposeRepository
from repositories.room_purpose_repository import RoomPurposeRepository
from repositories.room_resource_repository import RoomResourceRepository
from repositories.resource_repository import ResourceRepository
from repositories.user_repository import UserRepository

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _validate_supervisor(
    db: Session, room_type: str, supervisor_user_id: int | None
) -> None:
    if room_type == "laboratory" and supervisor_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ambientes de laboratório exigem um supervisor técnico",
        )

    if supervisor_user_id is not None:
        supervisor = UserRepository.get_user_by_id(db, supervisor_user_id)
        if supervisor is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário supervisor técnico não encontrado",
            )


def _validate_resources_exist(
    db: Session,
    fixed_resources: list[RoomResourceItemCreate],
    optional_resources: list[RoomResourceItemCreate],
) -> None:
    missing_ids: set[int] = set()
    for item in [*fixed_resources, *optional_resources]:
        if ResourceRepository.get_by_id(db, item.resource_id) is None:
            missing_ids.add(item.resource_id)

    if missing_ids:
        missing_list = ", ".join(str(resource_id) for resource_id in sorted(missing_ids))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"IDs de recurso não encontrados: {missing_list}",
        )


def _split_current_resources(
    room: RoomModel,
) -> tuple[list[RoomResourceItemCreate], list[RoomResourceItemCreate]]:
    fixed: list[RoomResourceItemCreate] = []
    optional: list[RoomResourceItemCreate] = []
    for link in room.resource_links:
        item = RoomResourceItemCreate(
            resource_id=link.resource_id,
            quantity=link.quantity,
        )
        if link.is_fixed:
            fixed.append(item)
        else:
            optional.append(item)
    return fixed, optional


def _build_room_response(room: RoomModel) -> dict[str, Any]:
    fixed_resources: list[RoomResourceItem] = []
    optional_resources: list[RoomResourceItem] = []
    for link in room.resource_links:
        resource = link.resource
        if resource is None:
            continue
        item = RoomResourceItem(
            id=link.id,
            resource_id=resource.id,
            resource_code=resource.resource_code,
            name=resource.name,
            resource_type=resource.resource_type,
            quantity=link.quantity,
        )
        if link.is_fixed:
            fixed_resources.append(item)
        else:
            optional_resources.append(item)

    return {
        "id": room.id,
        "room_id": room.room_id,
        "room_type": room.room_type,
        "location": room.location,
        "capacity": room.capacity,
        "accessibility": room.accessibility,
        "allowed_purposes": [
            link.purpose.name
            for link in room.purpose_links
            if link.purpose is not None and link.purpose.is_active
        ],
        "criticality": room.criticality,
        "supervisor_user_id": room.supervisor_user_id,
        "type_attributes": room.type_attributes,
        "is_active": room.is_active,
        "created_at": room.created_at,
        "updated_at": room.updated_at,
        "fixed_resources": fixed_resources,
        "optional_resources": optional_resources,
    }


def _normalize_purpose_names(purpose_names: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    for name in purpose_names:
        cleaned = name.strip()
        if not cleaned:
            continue
        dedupe_key = cleaned.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        normalized.append(cleaned)

    return normalized


def _upsert_room_purposes(db: Session, room_id: int, purpose_names: list[str]) -> None:
    normalized = _normalize_purpose_names(purpose_names)
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pelo menos uma finalidade permitida é obrigatória",
        )

    purpose_ids: list[int] = []
    for purpose_name in normalized:
        purpose = PurposeRepository.get_or_create_by_name(db, purpose_name)
        purpose_ids.append(purpose.id)

    RoomPurposeRepository.replace_for_room(db, room_id, purpose_ids)


@router.post("", response_model=Room, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_in: RoomCreate,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    """
    Create a new room - admin only

    Required fields:
    - room_id: unique room identifier
    - room_type: type of room
    - location: room location
    - capacity: room capacity (number of people)
    - accessibility: accessibility features available
    - allowed_purposes: list of allowed purposes for the room
    """
    # Check if room_id already exists
    existing_room = RoomRepository.get_room_by_room_id(db, room_in.room_id)
    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um ambiente com ID '{room_in.room_id}'",
        )

    _validate_supervisor(db, room_in.room_type, room_in.supervisor_user_id)
    _validate_resources_exist(db, room_in.fixed_resources, room_in.optional_resources)

    db_room = RoomRepository.create_room(db, room_in)
    _upsert_room_purposes(db, db_room.id, room_in.allowed_purposes)
    RoomResourceRepository.replace_for_room(
        db, db_room.id, room_in.fixed_resources, room_in.optional_resources
    )
    db.commit()
    db.refresh(db_room)
    return _build_room_response(db_room)


@router.get("", response_model=list[Room])
async def list_rooms(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
):
    """
    List all rooms

    Query parameters:
    - skip: number of rooms to skip (default: 0)
    - limit: maximum number of rooms to return (default: 100)
    - active_only: show only active rooms (default: true)
    """
    rooms = RoomRepository.get_all_rooms(
        db, skip=skip, limit=limit, active_only=active_only
    )
    return [_build_room_response(room) for room in rooms]


@router.get("/{room_id}", response_model=Room)
async def get_room(
    room_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get room by ID
    """
    room = RoomRepository.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ambiente não encontrado"
        )
    return _build_room_response(room)


@router.put("/{room_id}", response_model=Room)
async def update_room(
    room_id: int,
    room_update: RoomUpdate,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    """
    Update room - admin only
    """
    room = RoomRepository.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ambiente não encontrado"
        )

    # If updating room_id, check if new id doesn't exist
    if room_update.room_id and room_update.room_id != room.room_id:
        existing_room = RoomRepository.get_room_by_room_id(db, room_update.room_id)
        if existing_room:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe um ambiente com ID '{room_update.room_id}'",
            )

    update_data = room_update.model_dump(exclude_unset=True)
    effective_room_type = update_data.get("room_type", room.room_type)
    effective_supervisor_id = update_data.get(
        "supervisor_user_id", room.supervisor_user_id
    )
    _validate_supervisor(db, effective_room_type, effective_supervisor_id)

    current_fixed, current_optional = _split_current_resources(room)
    fixed_resources = room_update.fixed_resources
    optional_resources = room_update.optional_resources
    allowed_purposes = room_update.allowed_purposes

    if fixed_resources is None:
        fixed_resources = current_fixed
    if optional_resources is None:
        optional_resources = current_optional
    if allowed_purposes is None:
        allowed_purposes = [
            link.purpose.name
            for link in room.purpose_links
            if link.purpose is not None and link.purpose.is_active
        ]

    _validate_resources_exist(db, fixed_resources, optional_resources)

    updated_room = RoomRepository.update_room(db, room_id, room_update)
    _upsert_room_purposes(db, room_id, allowed_purposes)
    RoomResourceRepository.replace_for_room(
        db,
        room_id,
        fixed_resources,
        optional_resources,
    )
    db.commit()
    db.refresh(updated_room)
    return _build_room_response(updated_room)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: int,
    current_user: str = Depends(get_current_user_with_roles(required_roles=["admin"])),
    db: Session = Depends(get_db),
):
    """
    Delete room (soft delete) - admin only
    """
    room = RoomRepository.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ambiente não encontrado"
        )

    RoomRepository.delete_room(db, room_id)


@router.get("/search/capacity", response_model=list[Room])
async def search_by_capacity(
    min_capacity: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Search rooms by minimum capacity
    """
    rooms = RoomRepository.search_rooms_by_capacity(
        db, min_capacity=min_capacity, skip=skip, limit=limit
    )
    return [_build_room_response(room) for room in rooms]


@router.get("/search/location", response_model=list[Room])
async def search_by_location(
    location: str,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Search rooms by location
    """
    rooms = RoomRepository.search_rooms_by_location(
        db, location=location, skip=skip, limit=limit
    )
    return [_build_room_response(room) for room in rooms]
