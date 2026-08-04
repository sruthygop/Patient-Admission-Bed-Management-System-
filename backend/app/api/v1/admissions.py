from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User
from app.schemas.admission import (
    AdmissionCreate,
    AdmissionResponse,
    DischargeRequest
)
from app.crud.admission import (
    admit_patient,
    discharge_patient,
    get_active_admissions,
    get_admission,
    get_admission_history
)

router = APIRouter()


def check_role(current_user: User, allowed_roles: list):
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )


@router.post("/", response_model=AdmissionResponse, status_code=201)
def admit(
    admission_data: AdmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin, CMO, Doctor and Nurse can admit patients
    # Receptionist cannot admit
    check_role(current_user, ["admin", "cmo", "doctor", "nurse"])
    return admit_patient(db, admission_data, current_user.id)


@router.post("/{admission_id}/discharge", response_model=AdmissionResponse)
def discharge(
    admission_id: UUID,
    discharge_data: DischargeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin, CMO, Doctor and Nurse can discharge patients
    # Receptionist cannot discharge
    check_role(current_user, ["admin", "cmo", "doctor", "nurse"])
    return discharge_patient(db, admission_id, discharge_data, current_user.id)


@router.get("/active", response_model=list[AdmissionResponse])
def active_admissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view active admissions
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    return get_active_admissions(db, skip, limit)


@router.get("/{admission_id}", response_model=AdmissionResponse)
def admission_detail(
    admission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view admission details
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    admission = get_admission(db, admission_id)
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found"
        )
    return admission


@router.get("/history/{patient_id}", response_model=list[AdmissionResponse])
def admission_history(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view admission history
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    return get_admission_history(db, patient_id)