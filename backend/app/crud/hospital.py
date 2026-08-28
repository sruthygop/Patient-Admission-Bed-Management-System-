from uuid import UUID
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import Hospital
from app.schemas.hospital import HospitalCreate, HospitalUpdate


def create_hospital(db: Session, hospital_data: HospitalCreate) -> Hospital:
    # Check code uniqueness before hitting the DB constraint
    existing = db.query(Hospital).filter(Hospital.code == hospital_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hospital code '{hospital_data.code}' already exists"
        )

    new_hospital = Hospital(
        name=hospital_data.name,
        code=hospital_data.code,
        address=hospital_data.address,
        phone=hospital_data.phone,
        email=hospital_data.email,
        logo_url=hospital_data.logo_url
    )
    db.add(new_hospital)
    db.commit()
    db.refresh(new_hospital)
    return new_hospital


def get_hospitals(db: Session, skip: int = 0, limit: int = 100) -> List[Hospital]:
    return db.query(Hospital).order_by(Hospital.created_at.desc()).offset(skip).limit(limit).all()


def get_hospital(db: Session, hospital_id: UUID) -> Optional[Hospital]:
    return db.query(Hospital).filter(Hospital.id == hospital_id).first()


def update_hospital(db: Session, hospital_id: UUID, update_data: HospitalUpdate) -> Hospital:
    hospital = get_hospital(db, hospital_id)
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )

    if update_data.name is not None:
        hospital.name = update_data.name
    if update_data.is_active is not None:
        hospital.is_active = update_data.is_active
    if update_data.address is not None:
        hospital.address = update_data.address
    if update_data.phone is not None:
        hospital.phone = update_data.phone
    if update_data.email is not None:
        hospital.email = update_data.email
    if update_data.logo_url is not None:
        hospital.logo_url = update_data.logo_url

    db.commit()
    db.refresh(hospital)
    return hospital