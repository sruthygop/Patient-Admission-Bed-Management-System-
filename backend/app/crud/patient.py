from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.models import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.core.audit import log_audit

def get_patient(db: Session, patient_id: UUID) -> Optional[Patient]:
    """Retrieve a patient by ID (only if not soft-deleted)."""
    return db.query(Patient).filter(Patient.id == patient_id, Patient.is_deleted == False).first()

def get_patients(
    db: Session,
    search: Optional[str] = None,
    phone: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Patient]:
    """Retrieve all non-deleted patients with optional search/phone filtering and pagination."""
    query = db.query(Patient).filter(Patient.is_deleted == False)
    
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

def create_patient(db: Session, patient_in: PatientCreate, current_user_id: UUID) -> Patient:
    """Create a new patient and record a PATIENT_REGISTERED audit log entry."""
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
        is_deleted=False
    )
    db.add(db_patient)
    db.flush()

    new_values = patient_in.model_dump()
    new_values["date_of_birth"] = str(new_values["date_of_birth"])
    log_audit(
        db=db,
        user_id=current_user_id,
        action="PATIENT_REGISTERED",
        entity_name="patients",
        entity_id=db_patient.id,
        new_values=new_values
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
    """Update a patient's details, records changes, and write a PATIENT_UPDATED audit log entry."""
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
            new_values=new_values
        )
        db.commit()
        db.refresh(db_obj)
        
    return db_obj

def delete_patient(db: Session, db_obj: Patient, current_user_id: UUID) -> Patient:
    """Perform a soft delete on a patient and log a PATIENT_DELETED audit log entry."""
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
        new_values={"is_deleted": True}
    )
    
    db.commit()
    db.refresh(db_obj)
    return db_obj