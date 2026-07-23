from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, StaffAssignment, Ward
from app.core.audit import log_audit
from pydantic import BaseModel

router = APIRouter()

def check_role(current_user: User, allowed_roles: list):
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )

class StaffAssignmentCreate(BaseModel):
    ward_id: UUID
    staff_id: UUID
    shift_start: datetime
    shift_end: datetime

# Get all staff assignments
@router.get("/")
def get_staff_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "staff", "doctor"])
    assignments = db.query(StaffAssignment).all()
    
    result = []
    for a in assignments:
        staff = db.query(User).filter(User.id == a.staff_id).first()
        ward = db.query(Ward).filter(Ward.id == a.ward_id).first()
        result.append({
            "id": str(a.id),
            "ward_id": str(a.ward_id),
            "ward_name": ward.name if ward else "Unknown",
            "staff_id": str(a.staff_id),
            "staff_name": f"{staff.first_name} {staff.last_name}" if staff else "Unknown",
            "staff_username": staff.username if staff else "Unknown",
            "shift_start": a.shift_start.isoformat(),
            "shift_end": a.shift_end.isoformat(),
            "created_at": a.created_at.isoformat()
        })
    return result


# Assign staff to a ward
@router.post("/", status_code=201)
def assign_staff(
    assignment_data: StaffAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin"])
    
    # Check ward exists
    ward = db.query(Ward).filter(Ward.id == assignment_data.ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found"
        )
    
    # Check staff exists
    staff = db.query(User).filter(
        User.id == assignment_data.staff_id,
        User.role == "staff"
    ).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    
    # Create assignment
    assignment = StaffAssignment(
        ward_id=assignment_data.ward_id,
        staff_id=assignment_data.staff_id,
        shift_start=assignment_data.shift_start,
        shift_end=assignment_data.shift_end
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    log_audit(db, current_user.id, "STAFF_ASSIGNED", "staff_assignments",
              assignment.id, None, {
                  "ward_id": str(assignment_data.ward_id),
                  "staff_id": str(assignment_data.staff_id),
                  "shift_start": assignment_data.shift_start.isoformat(),
                  "shift_end": assignment_data.shift_end.isoformat()
              })
    db.commit()
    
    return {
        "id": str(assignment.id),
        "ward_id": str(assignment.ward_id),
        "ward_name": ward.name,
        "staff_id": str(assignment.staff_id),
        "staff_name": f"{staff.first_name} {staff.last_name}",
        "shift_start": assignment.shift_start.isoformat(),
        "shift_end": assignment.shift_end.isoformat(),
        "created_at": assignment.created_at.isoformat()
    }


# Delete staff assignment
@router.delete("/{assignment_id}")
def remove_staff_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin"])
    
    assignment = db.query(StaffAssignment).filter(
        StaffAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff assignment not found"
        )
    
    assignment_id_str = str(assignment.id)
    ward_id_str = str(assignment.ward_id)
    staff_id_str = str(assignment.staff_id)
    
    db.delete(assignment)
    db.commit()
    
    log_audit(db, current_user.id, "STAFF_REMOVED", "staff_assignments",
              assignment.id,
              {"ward_id": ward_id_str, "staff_id": staff_id_str},
              None)
    db.commit()
    
    return {"message": "Staff assignment removed successfully"}