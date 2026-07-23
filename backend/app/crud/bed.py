from uuid import UUID
from sqlalchemy.orm import Session
from app.models.models import Ward, Room, Bed
from app.schemas.bed import WardCreate, RoomCreate, BedCreate, BedStatusUpdate
from app.core.audit import log_audit


# --- Ward CRUD ---
def create_ward(db: Session, ward_data: WardCreate, user_id: UUID) -> Ward:
    ward = Ward(
        name=ward_data.name,
        type=ward_data.type,
        capacity=ward_data.capacity
    )
    db.add(ward)
    db.commit()
    db.refresh(ward)
    log_audit(db, user_id, "WARD_CREATED", "wards", ward.id, None, {
        "name": ward.name,
        "type": ward.type,
        "capacity": ward.capacity
    })
    return ward


def get_ward(db: Session, ward_id: UUID) -> Ward:
    return db.query(Ward).filter(Ward.id == ward_id).first()


def get_wards(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Ward).offset(skip).limit(limit).all()


# --- Room CRUD ---
def create_room(db: Session, room_data: RoomCreate, user_id: UUID) -> Room:
    room = Room(
        ward_id=room_data.ward_id,
        room_number=room_data.room_number,
        room_type=room_data.room_type
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    log_audit(db, user_id, "ROOM_CREATED", "rooms", room.id, None, {
        "ward_id": str(room.ward_id),
        "room_number": room.room_number,
        "room_type": room.room_type
    })
    return room


def get_rooms_by_ward(db: Session, ward_id: UUID):
    return db.query(Room).filter(Room.ward_id == ward_id).all()


# --- Bed CRUD ---
def create_bed(db: Session, bed_data: BedCreate, user_id: UUID) -> Bed:
    bed = Bed(
        room_id=bed_data.room_id,
        bed_number=bed_data.bed_number,
        status="available"
    )
    db.add(bed)
    db.commit()
    db.refresh(bed)
    log_audit(db, user_id, "BED_CREATED", "beds", bed.id, None, {
        "room_id": str(bed.room_id),
        "bed_number": bed.bed_number,
        "status": bed.status
    })
    return bed


def get_bed(db: Session, bed_id: UUID) -> Bed:
    return db.query(Bed).filter(Bed.id == bed_id).first()


def get_beds_by_room(db: Session, room_id: UUID):
    return db.query(Bed).filter(Bed.room_id == room_id).all()


def update_bed_status(db: Session, bed_id: UUID, status_data: BedStatusUpdate, user_id: UUID) -> Bed:
    bed = get_bed(db, bed_id)
    if not bed:
        return None
    old_status = bed.status
    bed.status = status_data.status
    db.commit()
    db.refresh(bed)
    log_audit(db, user_id, "BED_STATUS_UPDATED", "beds", bed.id,
                    {"status": old_status},
                    {"status": bed.status})
    return bed


def get_ward_occupancy(db: Session):
    wards = db.query(Ward).all()
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
            "ward_id": ward.id,
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