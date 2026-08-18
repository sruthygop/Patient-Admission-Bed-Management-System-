from uuid import UUID
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Ward, Room, Bed
from app.schemas.bed import WardCreate, RoomCreate, BedCreate, BedStatusUpdate
from app.core.audit import log_audit


# --- Ward CRUD ---
def create_ward(
    db: Session,
    ward_data: WardCreate,
    user_id: UUID,
    hospital_id: Optional[UUID] = None
) -> Ward:
    ward = Ward(
        name=ward_data.name,
        type=ward_data.type,
        capacity=ward_data.capacity,
        hospital_id=hospital_id
    )
    db.add(ward)
    db.commit()
    db.refresh(ward)
    log_audit(
        db=db, 
        user_id=user_id, 
        action="WARD_CREATED", 
        entity_name="wards", 
        entity_id=ward.id, 
        old_values=None, 
        new_values={
            "name": ward.name,
            "type": ward.type,
            "capacity": ward.capacity,
            "hospital_id": str(hospital_id) if hospital_id else None
        }, 
        hospital_id=hospital_id
    )
    return ward


def get_ward(
    db: Session, 
    ward_id: UUID,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> Optional[Ward]:
    query = db.query(Ward).filter(Ward.id == ward_id)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Ward.hospital_id == hospital_id)
    return query.first()


def get_wards(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> List[Ward]:
    query = db.query(Ward)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Ward.hospital_id == hospital_id)
    return query.offset(skip).limit(limit).all()


# --- Room CRUD ---
def create_room(
    db: Session, 
    room_data: RoomCreate, 
    user_id: UUID, 
    hospital_id: Optional[UUID] = None
) -> Room:
    room = Room(
        ward_id=room_data.ward_id,
        room_number=room_data.room_number,
        room_type=room_data.room_type,
        hospital_id=hospital_id
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    log_audit(
        db=db, 
        user_id=user_id, 
        action="ROOM_CREATED", 
        entity_name="rooms", 
        entity_id=room.id, 
        old_values=None, 
        new_values={
            "ward_id": str(room.ward_id),
            "room_number": room.room_number,
            "room_type": room.room_type
        }, 
        hospital_id=hospital_id
    )
    return room


def get_rooms_by_ward(
    db: Session, 
    ward_id: UUID,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> List[Room]:
    query = db.query(Room).filter(Room.ward_id == ward_id)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Room.hospital_id == hospital_id)
    return query.all()


# --- Bed CRUD ---
def create_bed(
    db: Session, 
    bed_data: BedCreate, 
    user_id: UUID, 
    hospital_id: Optional[UUID] = None
) -> Bed:
    bed = Bed(
        room_id=bed_data.room_id,
        bed_number=bed_data.bed_number,
        status="available",
        hospital_id=hospital_id
    )
    db.add(bed)
    db.commit()
    db.refresh(bed)
    log_audit(
        db=db, 
        user_id=user_id, 
        action="BED_CREATED", 
        entity_name="beds", 
        entity_id=bed.id, 
        old_values=None, 
        new_values={
            "room_id": str(bed.room_id),
            "bed_number": bed.bed_number,
            "status": bed.status
        }, 
        hospital_id=hospital_id
    )
    return bed


def get_bed(
    db: Session, 
    bed_id: UUID,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> Optional[Bed]:
    query = db.query(Bed).filter(Bed.id == bed_id)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Bed.hospital_id == hospital_id)
    return query.first()


def get_beds_by_room(
    db: Session, 
    room_id: UUID,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> List[Bed]:
    query = db.query(Bed).filter(Bed.room_id == room_id)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Bed.hospital_id == hospital_id)
    return query.all()


def update_bed_status(
    db: Session, 
    bed_id: UUID, 
    status_data: BedStatusUpdate, 
    user_id: UUID, 
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> Optional[Bed]:
    bed = get_bed(db, bed_id, hospital_id=hospital_id, user_role=user_role)
    if not bed:
        return None

    old_status = bed.status
    bed.status = status_data.status
    db.commit()
    db.refresh(bed)

    effective_hospital_id = hospital_id or getattr(bed, "hospital_id", None)

    log_audit(
        db=db, 
        user_id=user_id, 
        action="BED_STATUS_UPDATED", 
        entity_name="beds", 
        entity_id=bed.id,
        old_values={"status": old_status},
        new_values={"status": bed.status},
        hospital_id=effective_hospital_id
    )
    return bed


def get_ward_occupancy(
    db: Session,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> List[dict]:
    query = db.query(Ward)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Ward.hospital_id == hospital_id)

    wards = query.all()
    result = []
    for ward in wards:
        total_beds = 0
        occupied = 0
        available = 0
        maintenance = 0
        for room in ward.rooms:
            for bed in room.beds:
                total_beds += 1
                if bed.status == "occupied":
                    occupied += 1
                elif bed.status == "available":
                    available += 1
                elif bed.status == "maintenance":
                    maintenance += 1
        occupancy_rate = (occupied / total_beds * 100) if total_beds > 0 else 0
        result.append({
            "ward_id": str(ward.id),
            "ward_name": ward.name,
            "ward_type": ward.type,
            "capacity": ward.capacity,
            "total_beds": total_beds,
            "occupied_beds": occupied,
            "available_beds": available,
            "maintenance_beds": maintenance,
            "occupancy_rate": round(occupancy_rate, 2)
        })
    return result