from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User
from app.schemas.hospital import HospitalCreate, HospitalUpdate, HospitalResponse
from app.crud.hospital import (
    create_hospital,
    get_hospitals,
    get_hospital,
    update_hospital
)

router = APIRouter()


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to enforce Super Admin role access."""
    # Handle both string comparison and Enum comparison safely
    role_value = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if role_value != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user


@router.post("/", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
def create_new_hospital(
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Create a new hospital (Super Admin only)."""
    return create_hospital(db=db, hospital_data=hospital_data)


@router.get("/", response_model=List[HospitalResponse])
def list_hospitals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """List all hospitals (Super Admin only)."""
    return get_hospitals(db=db, skip=skip, limit=limit)


@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital_detail(
    hospital_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Get a single hospital's details (Super Admin only)."""
    hospital = get_hospital(db=db, hospital_id=hospital_id)
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    return hospital


@router.put("/{hospital_id}", response_model=HospitalResponse)
def update_hospital_details(
    hospital_id: UUID,
    update_data: HospitalUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Update hospital name or active status (Super Admin only)."""
    return update_hospital(db=db, hospital_id=hospital_id, update_data=update_data)