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
    extended_roles = allowed_roles + ["super_admin"]
    if current_user.role not in extended_roles:
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
    """Admit a patient attached to the current hospital."""
    check_role(current_user, ["admin", "cmo", "doctor", "nurse"])
    return admit_patient(
        db=db, 
        admission_data=admission_data, 
        user_id=current_user.id,
        hospital_id=current_user.hospital_id
    )


@router.post("/{admission_id}/discharge", response_model=AdmissionResponse)
def discharge(
    admission_id: UUID,
    discharge_data: DischargeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Discharge a patient (scoped to hospital)."""
    check_role(current_user, ["admin", "cmo", "doctor", "nurse"])
    return discharge_patient(
        db=db, 
        admission_id=admission_id, 
        discharge_data=discharge_data, 
        user_id=current_user.id,
        hospital_id=current_user.hospital_id,
        user_role=current_user.role
    )


@router.get("/active", response_model=list[AdmissionResponse])
def active_admissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get active admissions scoped to current user's hospital."""
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    return get_active_admissions(
        db=db, 
        skip=skip, 
        limit=limit,
        hospital_id=current_user.hospital_id,
        user_role=current_user.role
    )


@router.get("/{admission_id}", response_model=AdmissionResponse)
def admission_detail(
    admission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a single admission (scoped to hospital)."""
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    admission = get_admission(
        db=db, 
        admission_id=admission_id,
        hospital_id=current_user.hospital_id,
        user_role=current_user.role
    )
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
    """Get admission history for a patient (scoped to hospital)."""
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    return get_admission_history(
        db=db, 
        patient_id=patient_id,
        hospital_id=current_user.hospital_id,
        user_role=current_user.role
    )