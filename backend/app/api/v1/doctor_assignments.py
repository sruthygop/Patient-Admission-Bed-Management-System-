from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, DoctorAssignment, Admission
from app.core.audit import log_audit

router = APIRouter()

def check_role(current_user: User, allowed_roles: list):
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )

@router.get("/{admission_id}")
def get_doctor_assignments(
    admission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view doctor assignments
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    
    admission = db.query(Admission).filter(Admission.id == admission_id).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found"
        )
    
    assignments = db.query(DoctorAssignment).filter(
        DoctorAssignment.admission_id == admission_id
    ).all()
    
    result = []
    for a in assignments:
        doctor = db.query(User).filter(User.id == a.doctor_id).first()
        result.append({
            "id": str(a.id),
            "admission_id": str(a.admission_id),
            "doctor_id": str(a.doctor_id),
            "doctor_name": f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown",
            "doctor_username": doctor.username if doctor else "Unknown",
            "assigned_at": a.assigned_at.isoformat(),
            "unassigned_at": a.unassigned_at.isoformat() if a.unassigned_at else None,
            "notes": a.notes
        })
    return result


@router.post("/")
def assign_doctor(
    admission_id: UUID,
    doctor_id: UUID,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin, CMO and Nurse can assign doctors
    # Receptionist cannot assign doctors
    check_role(current_user, ["admin", "cmo", "nurse"])

    admission = db.query(Admission).filter(Admission.id == admission_id).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found"
        )

    doctor = db.query(User).filter(
        User.id == doctor_id,
        User.role == "doctor"
    ).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    assignment = DoctorAssignment(
        admission_id=admission_id,
        doctor_id=doctor_id,
        notes=notes or "Assigned by staff"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    log_audit(db, current_user.id, "DOCTOR_ASSIGNED", "doctor_assignments",
              assignment.id, None, {
                  "admission_id": str(admission_id),
                  "doctor_id": str(doctor_id)
              })
    db.commit()

    return {
        "id": str(assignment.id),
        "admission_id": str(assignment.admission_id),
        "doctor_id": str(assignment.doctor_id),
        "doctor_name": f"{doctor.first_name} {doctor.last_name}",
        "assigned_at": assignment.assigned_at.isoformat(),
        "notes": assignment.notes
    }


@router.delete("/{assignment_id}")
def unassign_doctor(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin, CMO and Nurse can unassign doctors
    check_role(current_user, ["admin", "cmo", "nurse"])

    assignment = db.query(DoctorAssignment).filter(
        DoctorAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    assignment.unassigned_at = datetime.now(timezone.utc)
    db.commit()

    log_audit(db, current_user.id, "DOCTOR_UNASSIGNED", "doctor_assignments",
              assignment.id, {"unassigned_at": None},
              {"unassigned_at": assignment.unassigned_at.isoformat()})
    db.commit()

    return {"message": "Doctor unassigned successfully"}


@router.get("/doctors/list")
def get_doctors_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view doctors list
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    doctors = db.query(User).filter(
        User.role == "doctor",
        User.is_active == True
    ).all()

    return [
        {
            "id": str(d.id),
            "username": d.username,
            "first_name": d.first_name,
            "last_name": d.last_name,
            "full_name": f"Dr. {d.first_name} {d.last_name}"
        }
        for d in doctors
    ]