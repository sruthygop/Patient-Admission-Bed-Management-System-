from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.api.v1.auth import get_current_user
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.crud import patient as patient_crud

router = APIRouter()

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "cmo", "nurse", "receptionist"]))
):
    """
    Register a new patient.
    Accessible by Admin, CMO, Nurse and Receptionist roles.
    """
    return patient_crud.create_patient(db=db, patient_in=patient_in, current_user_id=current_user.id)

@router.get("/", response_model=List[PatientResponse])
def read_patients(
    search: Optional[str] = None,
    phone: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "doctor", "cmo", "nurse", "receptionist"]))
):
    """
    Search and filter patients.
    Accessible by Admin, Doctor, CMO, Nurse and Receptionist roles.
    """
    return patient_crud.get_patients(db=db, search=search, phone=phone, skip=skip, limit=limit)

@router.get("/{patient_id}", response_model=PatientResponse)
def read_patient_by_id(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "doctor", "cmo", "nurse", "receptionist"]))
):
    """
    Get details of a single patient by ID.
    Accessible by Admin, Doctor, CMO, Nurse and Receptionist roles.
    """
    db_patient = patient_crud.get_patient(db=db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or has been deleted"
        )
    return db_patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient_details(
    patient_id: UUID,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "cmo", "nurse", "receptionist"]))
):
    """
    Update details of an existing patient.
    Accessible by Admin, CMO, Nurse and Receptionist roles.
    """
    db_patient = patient_crud.get_patient(db=db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient_crud.update_patient(
        db=db,
        db_obj=db_patient,
        obj_in=patient_in,
        current_user_id=current_user.id
    )

@router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
def remove_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Soft delete a patient.
    Restricted to Admin role only.
    """
    db_patient = patient_crud.get_patient(db=db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    patient_crud.delete_patient(db=db, db_obj=db_patient, current_user_id=current_user.id)
    return {"message": "Patient successfully deleted (soft delete)"}