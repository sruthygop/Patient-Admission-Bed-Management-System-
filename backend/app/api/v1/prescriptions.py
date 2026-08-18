from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import Prescription, Admission, Patient, User
from app.api.v1.auth import get_current_user

router = APIRouter()

class PrescriptionCreate(BaseModel):
    admission_id: str
    patient_id: str
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str = None


def check_hospital_access(current_user: User, hospital_id):
    if current_user.role == "super_admin":
        return
    if hospital_id and hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied — resource belongs to a different hospital"
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_prescription(
    prescription_in: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["doctor", "cmo", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and CMO can create prescriptions"
        )

    admission = db.query(Admission).filter(
        Admission.id == prescription_in.admission_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")

    # Verify admission belongs to current hospital
    check_hospital_access(current_user, getattr(admission, "hospital_id", None))

    prescription = Prescription(
        admission_id=prescription_in.admission_id,
        patient_id=prescription_in.patient_id,
        prescribed_by=current_user.id,
        medicine_name=prescription_in.medicine_name,
        dosage=prescription_in.dosage,
        frequency=prescription_in.frequency,
        duration=prescription_in.duration,
        instructions=prescription_in.instructions,
        is_active=True,
        hospital_id=current_user.hospital_id
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    return {
        "id": str(prescription.id),
        "medicine_name": prescription.medicine_name,
        "dosage": prescription.dosage,
        "frequency": prescription.frequency,
        "duration": prescription.duration,
        "instructions": prescription.instructions,
        "prescribed_at": prescription.prescribed_at,
        "prescribed_by_name": f"{current_user.first_name} {current_user.last_name}"
    }


@router.get("/admission/{admission_id}")
def get_prescriptions_by_admission(
    admission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Prescription).filter(
        Prescription.admission_id == admission_id
    )

    # Filter by hospital
    if current_user.role != "super_admin":
        query = query.filter(
            Prescription.hospital_id == current_user.hospital_id
        )

    prescriptions = query.order_by(Prescription.prescribed_at.desc()).all()

    result = []
    for p in prescriptions:
        doctor = db.query(User).filter(User.id == p.prescribed_by).first()
        result.append({
            "id": str(p.id),
            "medicine_name": p.medicine_name,
            "dosage": p.dosage,
            "frequency": p.frequency,
            "duration": p.duration,
            "instructions": p.instructions,
            "is_active": p.is_active,
            "prescribed_at": p.prescribed_at,
            "prescribed_by_name": f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown"
        })
    return result


@router.get("/patient/{patient_id}")
def get_prescriptions_by_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Prescription).filter(
        Prescription.patient_id == patient_id
    )

    # Filter by hospital
    if current_user.role != "super_admin":
        query = query.filter(
            Prescription.hospital_id == current_user.hospital_id
        )

    prescriptions = query.order_by(Prescription.prescribed_at.desc()).all()

    result = []
    for p in prescriptions:
        doctor = db.query(User).filter(User.id == p.prescribed_by).first()
        result.append({
            "id": str(p.id),
            "medicine_name": p.medicine_name,
            "dosage": p.dosage,
            "frequency": p.frequency,
            "duration": p.duration,
            "instructions": p.instructions,
            "is_active": p.is_active,
            "prescribed_at": p.prescribed_at,
            "prescribed_by_name": f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown"
        })
    return result


@router.delete("/{prescription_id}")
def deactivate_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["doctor", "cmo", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and CMO can deactivate prescriptions"
        )

    query = db.query(Prescription).filter(
        Prescription.id == prescription_id
    )

    # Filter by hospital
    if current_user.role != "super_admin":
        query = query.filter(
            Prescription.hospital_id == current_user.hospital_id
        )

    prescription = query.first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    prescription.is_active = False
    db.commit()

    return {"message": "Prescription deactivated successfully"}