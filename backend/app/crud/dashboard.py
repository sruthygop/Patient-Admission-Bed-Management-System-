from datetime import datetime, date, timedelta
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.models import Patient, Bed, Ward, Room, Admission

def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    # 1. Core global counts
    total_patients = db.query(Patient).filter(Patient.is_deleted == False).count()
    total_beds = db.query(Bed).count()
    occupied_beds = db.query(Bed).filter(Bed.status == "occupied").count()
    available_beds = db.query(Bed).filter(Bed.status == "available").count()
    maintenance_beds = db.query(Bed).filter(Bed.status == "maintenance").count()
    active_admissions = db.query(Admission).filter(Admission.status == "admitted").count()
    global_occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0.0

    # 2. Ward Occupancy list
    wards = db.query(Ward).all()
    ward_occupancy: List[Dict[str, Any]] = []
    for ward in wards:
        beds = db.query(Bed).join(Room).filter(Room.ward_id == ward.id).all()
        t_beds = len(beds)
        o_beds = sum(1 for b in beds if b.status == "occupied")
        a_beds = sum(1 for b in beds if b.status == "available")
        m_beds = sum(1 for b in beds if b.status == "maintenance")
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

    # 3. Admission Trends (Last 7 Days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=6)

    trends_dict: Dict[date, Dict[str, int]] = {}
    for i in range(7):
        d = (start_date + timedelta(days=i)).date()
        trends_dict[d] = {"admissions": 0, "discharges": 0}

    # Query admissions where admission OR discharge happened in last 7 days
    admissions_in_range = db.query(Admission).filter(
        or_(
            Admission.admission_date >= start_date,
            Admission.discharge_date >= start_date
        )
    ).all()

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

    # 4. Recent Admissions - both recently admitted AND recently discharged
    recent_adms_raw = db.query(Admission).filter(
        or_(
            Admission.admission_date >= datetime.now() - timedelta(days=30),
            Admission.discharge_date >= datetime.now() - timedelta(days=7)
        )
    ).order_by(
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