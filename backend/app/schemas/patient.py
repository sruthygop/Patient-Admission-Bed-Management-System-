from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator

class PatientBase(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    date_of_birth: date
    gender: str = Field(..., description="Gender must be 'male', 'female', or 'other'")
    phone_number: str = Field(..., max_length=15)
    email: Optional[EmailStr] = None
    address: str
    emergency_contact_name: str = Field(..., max_length=100)
    emergency_contact_phone: str = Field(..., max_length=15)
    blood_group: Optional[str] = Field(None, max_length=5)

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v: str) -> str:
        v_lower = v.lower()
        if v_lower not in ['male', 'female', 'other']:
            raise ValueError("Gender must be 'male', 'female', or 'other'")
        return v_lower

    @field_validator('blood_group')
    @classmethod
    def validate_blood_group(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_upper = v.upper()
        if v_upper not in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            raise ValueError("Invalid blood group format. Allowed: A+, A-, B+, B-, AB+, AB-, O+, O-")
        return v_upper

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=15)
    blood_group: Optional[str] = None

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_lower = v.lower()
        if v_lower not in ['male', 'female', 'other']:
            raise ValueError("Gender must be 'male', 'female', or 'other'")
        return v_lower

    @field_validator('blood_group')
    @classmethod
    def validate_blood_group(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_upper = v.upper()
        if v_upper not in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            raise ValueError("Invalid blood group format. Allowed: A+, A-, B+, B-, AB+, AB-, O+, O-")
        return v_upper

class PatientResponse(PatientBase):
    id: UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
