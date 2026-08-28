from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.models import Patient, Admission
from app.schemas.patient import PatientCreate, PatientUpdate
from app.core.audit import log_audit


def get_patient(
    db: Session,
    patient_id: UUID,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> Optional[Patient]:
    query = db.query(Patient).filter(Patient.id == patient_id, Patient.is_deleted == False)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Patient.hospital_id == hospital_id)
    return query.first()


def get_patients(
    db: Session,
    search: Optional[str] = None,
    phone: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    hospital_id: Optional[UUID] = None,
    user_role: Optional[str] = None
) -> List[Patient]:
    query = db.query(Patient).filter(Patient.is_deleted == False)
    if user_role != "super_admin" and hospital_id:
        query = query.filter(Patient.hospital_id == hospital_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(search_term),
                Patient.last_name.ilike(search_term)
            )
        )
    if phone:
        query = query.filter(Patient.phone_number.like(f"%{phone}%"))
    return query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()


def create_patient(
    db: Session,
    patient_in: PatientCreate,
    current_user_id: UUID,
    hospital_id: Optional[UUID] = None
) -> Patient:
    db_patient = Patient(
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        phone_number=patient_in.phone_number,
        email=patient_in.email,
        address=patient_in.address,
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        blood_group=patient_in.blood_group,
        hospital_id=hospital_id,
        is_deleted=False
    )
    db.add(db_patient)
    db.flush()

    new_values = patient_in.model_dump()
    new_values["date_of_birth"] = str(new_values["date_of_birth"])
    new_values["hospital_id"] = str(hospital_id) if hospital_id else None

    log_audit(
        db=db,
        user_id=current_user_id,
        action="PATIENT_REGISTERED",
        entity_name="patients",
        entity_id=db_patient.id,
        new_values=new_values,
        hospital_id=hospital_id
    )

    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient(
    db: Session,
    db_obj: Patient,
    obj_in: PatientUpdate,
    current_user_id: UUID
) -> Patient:
    old_values = {}
    new_values = {}

    update_data = obj_in.model_dump(exclude_unset=True)

    for field in update_data:
        old_val = getattr(db_obj, field)
        new_val = update_data[field]

        if old_val != new_val:
            old_values[field] = str(old_val) if isinstance(old_val, (date, datetime)) else old_val
            new_values[field] = str(new_val) if isinstance(new_val, (date, datetime)) else new_val
            setattr(db_obj, field, new_val)

    if old_values:
        log_audit(
            db=db,
            user_id=current_user_id,
            action="PATIENT_UPDATED",
            entity_name="patients",
            entity_id=db_obj.id,
            old_values=old_values,
            new_values=new_values,
            hospital_id=db_obj.hospital_id
        )
        db.commit()
        db.refresh(db_obj)

    return db_obj


def delete_patient(db: Session, db_obj: Patient, current_user_id: UUID) -> Patient:
    # Block deletion if patient has an active (non-discharged) admission
    active_admission = db.query(Admission).filter(
        Admission.patient_id == db_obj.id,
        Admission.discharge_date == None
    ).first()

    if active_admission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete patient with an active admission. Please discharge the patient first."
        )

    db_obj.is_deleted = True
    db.add(db_obj)

    log_audit(
        db=db,
        user_id=current_user_id,
        action="PATIENT_DELETED",
        entity_name="patients",
        entity_id=db_obj.id,
        old_values={
            "is_deleted": False,
            "patient_name": f"{db_obj.first_name} {db_obj.last_name}",
            "phone_number": db_obj.phone_number,
            "blood_group": db_obj.blood_group
        },
        new_values={"is_deleted": True},
        hospital_id=db_obj.hospital_id
    )

    db.commit()
    db.refresh(db_obj)
    return db_obj