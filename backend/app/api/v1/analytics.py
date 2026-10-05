from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from app.core.database import get_db
from app.models.models import Patient, Admission, Bed, Ward, Room, User
from app.api.v1.auth import get_current_user

router = APIRouter()

def check_role(current_user: User, allowed_roles: list):
    extended_roles = allowed_roles + ["super_admin"]
    if current_user.role not in extended_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )

@router.get("/stats")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin", "doctor", "cmo", "nurse", "receptionist"])

    # Scope by hospital
    hospital_id = None if current_user.role == "super_admin" else current_user.hospital_id

    # Patient Statistics — scoped by hospital
    patient_query = db.query(Patient).filter(Patient.is_deleted == False)
    admission_query = db.query(Admission)

    if hospital_id:
        patient_query = patient_query.filter(Patient.hospital_id == hospital_id)
        admission_query = admission_query.filter(Admission.hospital_id == hospital_id)

    total_patients = patient_query.count()
    total_admissions = admission_query.count()
    total_discharged = admission_query.filter(Admission.status == 'discharged').count()
    total_active = admission_query.filter(Admission.status == 'admitted').count()

    # Blood Group Distribution — scoped by hospital
    blood_group_query = db.query(
        Patient.blood_group,
        func.count(Patient.id).label('count')
    ).filter(
        Patient.is_deleted == False,
        Patient.blood_group != None
    )
    if hospital_id:
        blood_group_query = blood_group_query.filter(Patient.hospital_id == hospital_id)

    blood_groups = blood_group_query.group_by(Patient.blood_group).all()
    blood_group_data = [
        {"blood_group": bg or "Unknown", "count": count}
        for bg, count in blood_groups
    ]

    # Monthly Admission Trends (last 6 months) — scoped by hospital
    monthly_trends = []
    for i in range(5, -1, -1):
        dt = datetime.now() - timedelta(days=i * 30)
        month = dt.strftime("%b %Y")
        month_start = dt.replace(day=1, hour=0, minute=0, second=0)
        if dt.month == 12:
            month_end = dt.replace(year=dt.year + 1, month=1, day=1)
        else:
            month_end = dt.replace(month=dt.month + 1, day=1)

        adm_q = db.query(Admission).filter(
            Admission.admission_date >= month_start,
            Admission.admission_date < month_end
        )
        dis_q = db.query(Admission).filter(
            Admission.discharge_date >= month_start,
            Admission.discharge_date < month_end,
            Admission.status == 'discharged'
        )

        if hospital_id:
            adm_q = adm_q.filter(Admission.hospital_id == hospital_id)
            dis_q = dis_q.filter(Admission.hospital_id == hospital_id)

        monthly_trends.append({
            "month": month,
            "admissions": adm_q.count(),
            "discharges": dis_q.count()
        })

    # Ward Performance — scoped by hospital (optimized with joinedload)
    ward_query = db.query(Ward).options(
        joinedload(Ward.rooms).joinedload(Room.beds)
    )
    if hospital_id:
        ward_query = ward_query.filter(Ward.hospital_id == hospital_id)

    wards = ward_query.all()
    ward_performance = []
    for ward in wards:
        total_beds = 0
        occupied = 0
        for room in ward.rooms:
            for bed in room.beds:
                if hospital_id and bed.hospital_id != hospital_id:
                    continue
                total_beds += 1
                if bed.status == 'occupied':
                    occupied += 1
        rate = round((occupied / total_beds * 100), 1) if total_beds > 0 else 0
        ward_performance.append({
            "ward_name": ward.name,
            "ward_type": ward.type,
            "total_beds": total_beds,
            "occupied_beds": occupied,
            "occupancy_rate": rate
        })

    # Average Length of Stay — scoped by hospital
    discharged_query = db.query(Admission).filter(
        Admission.status == 'discharged',
        Admission.discharge_date != None
    )
    if hospital_id:
        discharged_query = discharged_query.filter(Admission.hospital_id == hospital_id)

    discharged_admissions = discharged_query.all()

    if discharged_admissions:
        total_days = sum(
            (adm.discharge_date - adm.admission_date).days
            for adm in discharged_admissions
        )
        avg_stay = round(total_days / len(discharged_admissions), 1)
    else:
        avg_stay = 0

    # Gender Distribution — scoped by hospital
    gender_query = db.query(
        Patient.gender,
        func.count(Patient.id).label('count')
    ).filter(Patient.is_deleted == False)

    if hospital_id:
        gender_query = gender_query.filter(Patient.hospital_id == hospital_id)

    gender_data = gender_query.group_by(Patient.gender).all()
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