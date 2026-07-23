from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.schemas.patient import PatientResponse
from app.schemas.bed import BedResponse

# --- Doctor Assignment Schemas ---
class DoctorAssignmentBase(BaseModel):
    doctor_id: UUID
    notes: Optional[str] = None

class DoctorAssignmentResponse(DoctorAssignmentBase):
    id: UUID
    admission_id: UUID
    assigned_at: datetime
    unassigned_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Admission Schemas ---
class AdmissionCreate(BaseModel):
    patient_id: UUID
    bed_id: UUID
    reason_for_admission: str
    primary_doctor_id: UUID

class DischargeRequest(BaseModel):
    bed_status: str = Field("maintenance", description="Post-discharge bed status. Allowed: 'available', 'maintenance'")

    @field_validator('bed_status')
    @classmethod
    def validate_bed_status(cls, v: str) -> str:
        v_lower = v.lower()
        if v_lower not in ['available', 'maintenance']:
            raise ValueError("Post-discharge bed status must be 'available' or 'maintenance'")
        return v_lower

class AdmissionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    bed_id: Optional[UUID] = None
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    reason_for_admission: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    patient: Optional[PatientResponse] = None
    bed: Optional[BedResponse] = None
    doctor_assignments: List[DoctorAssignmentResponse] = []

    model_config = ConfigDict(from_attributes=True)
