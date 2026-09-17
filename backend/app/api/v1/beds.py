from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User
from app.schemas.bed import (
    WardCreate, WardResponse, WardOccupancyResponse,
    RoomCreate, RoomResponse,
    BedCreate, BedResponse, BedStatusUpdate
)
from app.schemas.pagination import PaginatedResponse
from app.crud.bed import (
    create_ward, get_ward, get_wards,
    create_room, get_rooms_by_ward,
    create_bed, get_bed, get_beds, update_bed_status,
    get_ward_occupancy
)

router = APIRouter()


def check_role(current_user: User, allowed_roles: list):
    # Allow super_admin by default alongside listed roles
    extended_roles = allowed_roles + ["super_admin"]
    if current_user.role not in extended_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )


# --- Ward Endpoints ---
@router.post("/wards", response_model=WardResponse, status_code=201)
def add_ward(
    ward_data: WardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admin can create wards
    check_role(current_user, ["admin"])
    return create_ward(db, ward_data, current_user.id, current_user.hospital_id)


@router.get("/wards", response_model=list[WardResponse])
def list_wards(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view wards
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    return get_wards(db, skip, limit, hospital_id=current_user.hospital_id, user_role=current_user.role)


@router.get("/wards/occupancy", response_model=list[WardOccupancyResponse])
def ward_occupancy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view occupancy
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    return get_ward_occupancy(db, hospital_id=current_user.hospital_id, user_role=current_user.role)


# --- Room Endpoints ---
@router.post("/rooms", response_model=RoomResponse, status_code=201)
def add_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admin can create rooms
    check_role(current_user, ["admin"])
    ward = get_ward(db, room_data.ward_id, hospital_id=current_user.hospital_id, user_role=current_user.role)
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found"
        )
    
    # Ensure admin isn't creating rooms in another hospital's ward
    if current_user.role != "super_admin" and ward.hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot add room to a ward in another hospital"
        )

    return create_room(db, room_data, current_user.id, current_user.hospital_id)


@router.get("/wards/{ward_id}/rooms", response_model=list[RoomResponse])
def list_rooms(
    ward_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view rooms
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    ward = get_ward(db, ward_id, hospital_id=current_user.hospital_id, user_role=current_user.role)
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found"
        )

    # Scoping check
    if current_user.role != "super_admin" and ward.hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this hospital's ward"
        )

    return get_rooms_by_ward(db, ward_id, hospital_id=current_user.hospital_id, user_role=current_user.role)


# --- Bed Endpoints ---
@router.post("/beds", response_model=BedResponse, status_code=201)
def add_bed(
    bed_data: BedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admin can create beds
    check_role(current_user, ["admin"])
    return create_bed(db, bed_data, current_user.id, current_user.hospital_id)


@router.get("/beds", response_model=PaginatedResponse[BedResponse])
def list_beds(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view beds
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])

    skip = (page - 1) * page_size
    items, total_count = get_beds(
        db=db,
        skip=skip,
        limit=page_size,
        hospital_id=current_user.hospital_id,
        user_role=current_user.role
    )
    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size
    )


@router.put("/{bed_id}/status", response_model=BedResponse)
def change_bed_status(
    bed_id: UUID,
    status_data: BedStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin, CMO and Nurse can update bed status
    check_role(current_user, ["admin", "cmo", "nurse"])
    bed = update_bed_status(
        db=db,
        bed_id=bed_id,
        status_data=status_data,
        user_id=current_user.id,
        hospital_id=current_user.hospital_id,
        user_role=current_user.role
    )
    if not bed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bed not found"
        )
    return bed