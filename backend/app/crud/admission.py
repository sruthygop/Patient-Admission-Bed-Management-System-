from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.models import Admission, Bed, Patient, DoctorAssignment
from app.schemas.admission import AdmissionCreate, DischargeRequest
from app.core.audit import log_audit


def admit_patient(db: Session, admission_data: AdmissionCreate, user_id: UUID) -> Admission:
    # 1. Check patient exists
    patient = db.query(Patient).filter(
        Patient.id == admission_data.patient_id,
        Patient.is_deleted == False
    ).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # 2. Check patient not already admitted
    active_admission = db.query(Admission).filter(
        Admission.patient_id == admission_data.patient_id,
        Admission.status == "admitted"
    ).first()
    if active_admission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient already has an active admission. Please discharge first."
        )

    # 3. Check bed exists and is available
    bed = db.query(Bed).filter(Bed.id == admission_data.bed_id).first()
    if not bed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bed not found"
        )
    if bed.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bed is not available. Current status: {bed.status}"
        )

    # 4. Create admission
    admission = Admission(
        patient_id=admission_data.patient_id,
        bed_id=admission_data.bed_id,
        reason_for_admission=admission_data.reason_for_admission,
        status="admitted"
    )
    db.add(admission)
    db.flush()

    # 5. Update bed status to occupied
    bed.status = "occupied"

    db.commit()
    db.refresh(admission)

    # 6. Write audit log
    log_audit(db, user_id, "PATIENT_ADMITTED", "admissions", admission.id, None, {
        "patient_id": str(admission_data.patient_id),
        "bed_id": str(admission_data.bed_id),
        "reason": admission_data.reason_for_admission
    })
    db.commit()

    return admission


def discharge_patient(db: Session, admission_id: UUID, discharge_data: DischargeRequest, user_id: UUID) -> Admission:
    # 1. Find active admission
    admission = db.query(Admission).filter(
        Admission.id == admission_id,
        Admission.status == "admitted"
    ).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active admission not found"
        )

    # 2. Update admission
    admission.status = "discharged"
    admission.discharge_date = datetime.now(timezone.utc)

    # 3. Update bed status
    if admission.bed_id:
        bed = db.query(Bed).filter(Bed.id == admission.bed_id).first()
        if bed:
            bed.status = discharge_data.bed_status

    db.commit()
    db.refresh(admission)

    # 4. Write audit log
    log_audit(db, user_id, "PATIENT_DISCHARGED", "admissions", admission.id,
                    {"status": "admitted"},
                    {"status": "discharged", "bed_status": discharge_data.bed_status})
    db.commit()

    return admission


def get_active_admissions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Admission).options(
        joinedload(Admission.patient),
        joinedload(Admission.bed),
        joinedload(Admission.doctor_assignments)
    ).filter(
        Admission.status == "admitted"
    ).order_by(Admission.admission_date.desc()).offset(skip).limit(limit).all()

def get_admission(db: Session, admission_id: UUID) -> Admission:
    return db.query(Admission).options(
        joinedload(Admission.patient),
        joinedload(Admission.bed),
        joinedload(Admission.doctor_assignments)
    ).filter(Admission.id == admission_id).first()


def get_admission_history(db: Session, patient_id: UUID):
    return db.query(Admission).filter(
        Admission.patient_id == patient_id
    ).order_by(Admission.admission_date.desc()).all()