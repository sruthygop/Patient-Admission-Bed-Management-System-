from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, StaffAssignment, Ward
from app.core.audit import log_audit
from pydantic import BaseModel

router = APIRouter()


def check_role(current_user: User, allowed_roles: list):
    extended_roles = allowed_roles + ["super_admin"]
    if current_user.role not in extended_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )


class StaffAssignmentCreate(BaseModel):
    ward_id: UUID
    staff_id: UUID
    shift_start: datetime
    shift_end: datetime


@router.get("/")
def get_staff_assignments(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: str = Query(None, description="Search by staff name, username, or ward name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])

    query = db.query(StaffAssignment).options(
        joinedload(StaffAssignment.ward),
        joinedload(StaffAssignment.staff)
    ).join(Ward, StaffAssignment.ward_id == Ward.id).join(User, StaffAssignment.staff_id == User.id)

    if current_user.role != "super_admin":
        query = query.filter(Ward.hospital_id == current_user.hospital_id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.username.ilike(search_term),
                Ward.name.ilike(search_term),
            )
        )

    total_count = query.count()
    skip = (page - 1) * page_size
    assignments = query.offset(skip).limit(page_size).all()

    items = []
    for a in assignments:
        staff = a.staff if hasattr(a, 'staff') else db.query(User).filter(User.id == a.staff_id).first()
        ward = a.ward if hasattr(a, 'ward') else db.query(Ward).filter(Ward.id == a.ward_id).first()
        items.append({
            "id": str(a.id),
            "ward_id": str(a.ward_id),
            "ward_name": ward.name if ward else "Unknown",
            "staff_id": str(a.staff_id),
            "staff_name": f"{staff.first_name} {staff.last_name}" if staff else "Unknown",
            "staff_username": staff.username if staff else "Unknown",
            "shift_start": a.shift_start.isoformat() if a.shift_start else None,
            "shift_end": a.shift_end.isoformat() if a.shift_end else None,
            "created_at": a.created_at.isoformat() if getattr(a, 'created_at', None) else None
        })

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }


@router.post("/", status_code=201)
def assign_staff(
    assignment_data: StaffAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "cmo"])

    ward = db.query(Ward).filter(Ward.id == assignment_data.ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found"
        )

    if current_user.role != "super_admin" and ward.hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied — ward belongs to a different hospital"
        )

    staff = db.query(User).filter(
        User.id == assignment_data.staff_id,
        User.role.in_(["nurse", "receptionist", "staff", "cmo", "doctor"]),
        User.is_active == True
    ).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    if current_user.role != "super_admin" and staff.hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied — staff belongs to a different hospital"
        )

    target_hospital_id = current_user.hospital_id or ward.hospital_id

    assignment = StaffAssignment(
        ward_id=assignment_data.ward_id,
        staff_id=assignment_data.staff_id,
        shift_start=assignment_data.shift_start,
        shift_end=assignment_data.shift_end,
        hospital_id=target_hospital_id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="STAFF_ASSIGNED",
        entity_name="staff_assignments",
        entity_id=assignment.id,
        old_values=None,
        new_values={
            "ward_id": str(assignment_data.ward_id),
            "staff_id": str(assignment_data.staff_id),
            "shift_start": assignment_data.shift_start.isoformat(),
            "shift_end": assignment_data.shift_end.isoformat()
        },
        hospital_id=target_hospital_id
    )
    db.commit()

    return {
        "id": str(assignment.id),
        "ward_id": str(assignment.ward_id),
        "ward_name": ward.name,
        "staff_id": str(assignment.staff_id),
        "staff_name": f"{staff.first_name} {staff.last_name}",
        "shift_start": assignment.shift_start.isoformat() if assignment.shift_start else None,
        "shift_end": assignment.shift_end.isoformat() if assignment.shift_end else None,
        "created_at": assignment.created_at.isoformat() if getattr(assignment, 'created_at', None) else None
    }


@router.delete("/{assignment_id}")
def remove_staff_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "cmo"])

    assignment = db.query(StaffAssignment).filter(
        StaffAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff assignment not found"
        )

    if current_user.role != "super_admin" and getattr(assignment, 'hospital_id', None):
        if assignment.hospital_id != current_user.hospital_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied — assignment belongs to a different hospital"
            )

    assignment_id_str = str(assignment.id)
    ward_id_str = str(assignment.ward_id)
    staff_id_str = str(assignment.staff_id)
    assignment_hospital_id = getattr(assignment, 'hospital_id', None)

    db.delete(assignment)
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        action="STAFF_REMOVED",
        entity_name="staff_assignments",
        entity_id=assignment_id_str,
        old_values={"ward_id": ward_id_str, "staff_id": staff_id_str},
        new_values=None,
        hospital_id=assignment_hospital_id
    )
    db.commit()

    return {"message": "Staff assignment removed successfully"}