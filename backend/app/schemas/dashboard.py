from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

class RecentAdmissionItem(BaseModel):
    id: UUID
    patient_id: UUID
    patient_name: str
    bed_id: Optional[UUID] = None
    bed_number: Optional[str] = None
    room_number: Optional[str] = None
    ward_name: Optional[str] = None
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    status: str
    reason_for_admission: str

class WardOccupancyItem(BaseModel):
    ward_id: UUID
    ward_name: str
    ward_type: str
    capacity: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    maintenance_beds: int
    occupancy_rate: float

class AdmissionTrendItem(BaseModel):
    date: str
    admissions: int
    discharges: int

class DashboardStatsResponse(BaseModel):
    total_patients: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    maintenance_beds: int
    active_admissions: int
    global_occupancy_rate: float
    
    ward_occupancy: List[WardOccupancyItem]
    admission_trends: List[AdmissionTrendItem]
    recent_admissions: List[RecentAdmissionItem]
