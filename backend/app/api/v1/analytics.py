from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import Patient, Admission, Bed, Ward, Room, User
from app.api.v1.auth import get_current_user

router = APIRouter()

def check_role(current_user: User, allowed_roles: list):
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )

@router.get("/stats")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # All roles can view analytics
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])

    # Patient Statistics
    total_patients = db.query(Patient).filter(Patient.is_deleted == False).count()
    total_admissions = db.query(Admission).count()
    total_discharged = db.query(Admission).filter(Admission.status == 'discharged').count()
    total_active = db.query(Admission).filter(Admission.status == 'admitted').count()

    # Blood Group Distribution
    blood_groups = db.query(
        Patient.blood_group,
        func.count(Patient.id).label('count')
    ).filter(
        Patient.is_deleted == False,
        Patient.blood_group != None
    ).group_by(Patient.blood_group).all()

    blood_group_data = [
        {"blood_group": bg or "Unknown", "count": count}
        for bg, count in blood_groups
    ]

    # Monthly Admission Trends (last 6 months)
    monthly_trends = []
    for i in range(5, -1, -1):
        date = datetime.now() - timedelta(days=i * 30)
        month = date.strftime("%b %Y")
        month_start = date.replace(day=1, hour=0, minute=0, second=0)
        if date.month == 12:
            month_end = date.replace(year=date.year + 1, month=1, day=1)
        else:
            month_end = date.replace(month=date.month + 1, day=1)

        admissions_count = db.query(Admission).filter(
            Admission.admission_date >= month_start,
            Admission.admission_date < month_end
        ).count()

        discharges_count = db.query(Admission).filter(
            Admission.discharge_date >= month_start,
            Admission.discharge_date < month_end,
            Admission.status == 'discharged'
        ).count()

        monthly_trends.append({
            "month": month,
            "admissions": admissions_count,
            "discharges": discharges_count
        })

    # Ward Performance
    wards = db.query(Ward).all()
    ward_performance = []
    for ward in wards:
        beds = db.query(Bed).join(Room).filter(Room.ward_id == ward.id).all()
        total_beds = len(beds)
        occupied = sum(1 for b in beds if b.status == 'occupied')
        rate = round((occupied / total_beds * 100), 1) if total_beds > 0 else 0
        ward_performance.append({
            "ward_name": ward.name,
            "ward_type": ward.type,
            "total_beds": total_beds,
            "occupied_beds": occupied,
            "occupancy_rate": rate
        })

    # Average Length of Stay
    discharged_admissions = db.query(Admission).filter(
        Admission.status == 'discharged',
        Admission.discharge_date != None
    ).all()

    if discharged_admissions:
        total_days = sum(
            (adm.discharge_date - adm.admission_date).days
            for adm in discharged_admissions
        )
        avg_stay = round(total_days / len(discharged_admissions), 1)
    else:
        avg_stay = 0

    # Gender Distribution
    gender_data = db.query(
        Patient.gender,
        func.count(Patient.id).label('count')
    ).filter(
        Patient.is_deleted == False
    ).group_by(Patient.gender).all()

    gender_distribution = [
        {"gender": gender.capitalize(), "count": count}
        for gender, count in gender_data
    ]

    return {
        "patient_stats": {
            "total_patients": total_patients,
            "total_admissions": total_admissions,
            "total_discharged": total_discharged,
            "total_active": total_active,
            "avg_length_of_stay": avg_stay
        },
        "blood_group_distribution": blood_group_data,
        "monthly_trends": monthly_trends,
        "ward_performance": ward_performance,
        "gender_distribution": gender_distribution
    }