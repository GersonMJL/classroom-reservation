from typing import List

from core.jwt_bearer import get_current_user, get_current_user_with_roles
from core.database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.room import Room, RoomCreate, RoomUpdate
from repositories.room_repository import RoomRepository

router = APIRouter(prefix="/rooms", tags=["rooms"])


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
            detail=f"Room with ID '{room_in.room_id}' already exists",
        )

    db_room = RoomRepository.create_room(db, room_in)
    return db_room


@router.get("", response_model=List[Room])
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
    return rooms


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
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )
    return room


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
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )

    # If updating room_id, check if new id doesn't exist
    if room_update.room_id and room_update.room_id != room.room_id:
        existing_room = RoomRepository.get_room_by_room_id(db, room_update.room_id)
        if existing_room:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Room with ID '{room_update.room_id}' already exists",
            )

    updated_room = RoomRepository.update_room(db, room_id, room_update)
    return updated_room


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
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )

    RoomRepository.delete_room(db, room_id)


@router.get("/search/capacity", response_model=List[Room])
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
    return rooms


@router.get("/search/location", response_model=List[Room])
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
    return rooms
