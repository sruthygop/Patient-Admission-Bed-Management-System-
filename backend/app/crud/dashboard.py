from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from app.models.models import Patient, Bed, Ward, Room, Admission


def get_dashboard_stats(db: Session, hospital_id: Optional[UUID] = None) -> Dict[str, Any]:

    # 1. Core global counts — filtered by hospital
    patient_query = db.query(Patient).filter(Patient.is_deleted == False)
    bed_query = db.query(Bed)
    admission_query = db.query(Admission)

    if hospital_id:
        patient_query = patient_query.filter(Patient.hospital_id == hospital_id)
        bed_query = bed_query.filter(Bed.hospital_id == hospital_id)
        admission_query = admission_query.filter(Admission.hospital_id == hospital_id)

    total_patients = patient_query.count()
    total_beds = bed_query.count()
    occupied_beds = bed_query.filter(Bed.status == "occupied").count()
    available_beds = bed_query.filter(Bed.status == "available").count()
    maintenance_beds = bed_query.filter(Bed.status == "maintenance").count()
    active_admissions = admission_query.filter(Admission.status == "admitted").count()
    global_occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0.0

    # 2. Ward Occupancy — optimized with eager loading (fixes N+1 query issue)
    ward_query = db.query(Ward).options(
        joinedload(Ward.rooms).joinedload(Room.beds)
    )
    if hospital_id:
        ward_query = ward_query.filter(Ward.hospital_id == hospital_id)
    wards = ward_query.all()

    ward_occupancy: List[Dict[str, Any]] = []
    for ward in wards:
        t_beds = 0
        o_beds = 0
        a_beds = 0
        m_beds = 0
        for room in ward.rooms:
            for bed in room.beds:
                # Defense-in-depth: verify bed belongs to correct hospital
                if hospital_id and bed.hospital_id != hospital_id:
                    continue
                t_beds += 1
                if bed.status == "occupied":
                    o_beds += 1
                elif bed.status == "available":
                    a_beds += 1
                elif bed.status == "maintenance":
                    m_beds += 1

        occ_rate = (o_beds / t_beds * 100) if t_beds > 0 else 0.0
        ward_occupancy.append({
            "ward_id": ward.id,
            "ward_name": ward.name,
            "ward_type": ward.type,
            "capacity": ward.capacity,
            "total_beds": t_beds,
            "occupied_beds": o_beds,
            "available_beds": a_beds,
            "maintenance_beds": m_beds,
            "occupancy_rate": round(occ_rate, 2)
        })

    # 3. Admission Trends (Last 7 Days) — filtered by hospital
    end_date = datetime.now()
    start_date = end_date - timedelta(days=6)

    trends_dict: Dict[date, Dict[str, int]] = {}
    for i in range(7):
        d = (start_date + timedelta(days=i)).date()
        trends_dict[d] = {"admissions": 0, "discharges": 0}

    trend_query = db.query(Admission).filter(
        or_(
            Admission.admission_date >= start_date,
            Admission.discharge_date >= start_date
        )
    )
    if hospital_id:
        trend_query = trend_query.filter(Admission.hospital_id == hospital_id)

    admissions_in_range = trend_query.all()

    for adm in admissions_in_range:
        adm_date = adm.admission_date.date()
        if adm_date in trends_dict:
            trends_dict[adm_date]["admissions"] += 1
        if adm.discharge_date:
            dis_date = adm.discharge_date.date()
            if dis_date in trends_dict:
                trends_dict[dis_date]["discharges"] += 1

    admission_trends = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "admissions": val["admissions"],
            "discharges": val["discharges"]
        }
        for d, val in sorted(trends_dict.items())
    ]

    # 4. Recent Admissions — filtered by hospital
    recent_query = db.query(Admission).filter(
        or_(
            Admission.admission_date >= datetime.now() - timedelta(days=30),
            Admission.discharge_date >= datetime.now() - timedelta(days=7)
        )
    )
    if hospital_id:
        recent_query = recent_query.filter(Admission.hospital_id == hospital_id)

    recent_adms_raw = recent_query.order_by(
        Admission.admission_date.desc()
    ).limit(10).all()

    recent_admissions = []
    for adm in recent_adms_raw:
        patient_name = f"{adm.patient.first_name} {adm.patient.last_name}" if adm.patient else "Unknown"
        bed_num = adm.bed.bed_number if adm.bed else None
        room_num = adm.bed.room.room_number if adm.bed and adm.bed.room else None
        ward_name = adm.bed.room.ward.name if adm.bed and adm.bed.room and adm.bed.room.ward else None

        recent_admissions.append({
            "id": adm.id,
            "patient_id": adm.patient_id,
            "patient_name": patient_name,
            "bed_id": adm.bed_id,
            "bed_number": bed_num,
            "room_number": room_num,
            "ward_name": ward_name,
            "admission_date": adm.admission_date,
            "discharge_date": adm.discharge_date,
            "status": adm.status,
            "reason_for_admission": adm.reason_for_admission
        })

    return {
        "total_patients": total_patients,
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "available_beds": available_beds,
        "maintenance_beds": maintenance_beds,
        "active_admissions": active_admissions,
        "global_occupancy_rate": round(global_occupancy_rate, 2),
        "ward_occupancy": ward_occupancy,
        "admission_trends": admission_trends,
        "recent_admissions": recent_admissions
    }