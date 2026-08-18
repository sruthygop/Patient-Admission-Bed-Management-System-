from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, DoctorAssignment, Admission, Patient
from app.core.audit import log_audit

router = APIRouter()


def check_role(current_user: User, allowed_roles: list):
    extended_roles = allowed_roles + ["super_admin"]
    if current_user.role not in extended_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )


def verify_admission_hospital_access(admission: Admission, current_user: User):
    if current_user.role == "super_admin":
        return
    admission_hospital_id = getattr(admission, "hospital_id", None)
    if admission_hospital_id is None and admission.patient:
        admission_hospital_id = admission.patient.hospital_id
    if admission_hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied — admission belongs to a different hospital"
        )


@router.get("/doctors/list")
def get_doctors_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    if current_user.role == "super_admin":
        doctors = db.query(User).filter(
            User.role == "doctor",
            User.is_active == True
        ).all()
    else:
        doctors = db.query(User).filter(
            User.role == "doctor",
            User.is_active == True,
            User.hospital_id == current_user.hospital_id
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


@router.get("/{admission_id}")
def get_doctor_assignments(
    admission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])
    admission = db.query(Admission).filter(Admission.id == admission_id).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found"
        )
    verify_admission_hospital_access(admission, current_user)
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
            "doctor_name": f"Dr. {doctor.first_name} {doctor.last_name}" if doctor else "Unknown",
            "doctor_username": doctor.username if doctor else "Unknown",
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
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
    check_role(current_user, ["admin", "cmo", "nurse"])
    admission = db.query(Admission).filter(Admission.id == admission_id).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found"
        )
    verify_admission_hospital_access(admission, current_user)
    doctor = db.query(User).filter(
        User.id == doctor_id,
        User.role == "doctor",
        User.is_active == True
    ).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    if current_user.role != "super_admin" and doctor.hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied — doctor belongs to a different hospital"
        )
    target_hospital_id = current_user.hospital_id or getattr(doctor, "hospital_id", None)
    assignment = DoctorAssignment(
        admission_id=admission_id,
        doctor_id=doctor_id,
        hospital_id=target_hospital_id,
        notes=notes or "Assigned by staff"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    log_audit(
        db=db,
        user_id=current_user.id,
        action="DOCTOR_ASSIGNED",
        entity_name="doctor_assignments",
        entity_id=assignment.id,
        old_values=None,
        new_values={
            "admission_id": str(admission_id),
            "doctor_id": str(doctor_id)
        },
        hospital_id=target_hospital_id
    )
    db.commit()
    return {
        "id": str(assignment.id),
        "admission_id": str(assignment.admission_id),
        "doctor_id": str(assignment.doctor_id),
        "doctor_name": f"Dr. {doctor.first_name} {doctor.last_name}",
        "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
        "notes": assignment.notes
    }


@router.delete("/{assignment_id}")
def unassign_doctor(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "cmo", "nurse"])
    assignment = db.query(DoctorAssignment).filter(
        DoctorAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    if current_user.role != "super_admin" and getattr(assignment, "hospital_id", None):
        if assignment.hospital_id != current_user.hospital_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied — assignment belongs to a different hospital"
            )
    assignment.unassigned_at = datetime.now(timezone.utc)
    db.commit()
    log_audit(
        db=db,
        user_id=current_user.id,
        action="DOCTOR_UNASSIGNED",
        entity_name="doctor_assignments",
        entity_id=assignment.id,
        old_values={"unassigned_at": None},
        new_values={"unassigned_at": assignment.unassigned_at.isoformat()},
        hospital_id=getattr(assignment, "hospital_id", None)
    )
    db.commit()
    return {"message": "Doctor unassigned successfully"}