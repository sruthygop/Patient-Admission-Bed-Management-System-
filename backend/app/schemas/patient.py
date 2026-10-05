from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from app.core.sanitize import sanitize_text


class PatientCreate(BaseModel):
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

    @field_validator('first_name', 'last_name', 'address', 'emergency_contact_name')
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        cleaned = sanitize_text(v)
        if not cleaned or not cleaned.strip():
            raise ValueError("This field cannot be empty or contain only spaces")
        return cleaned

    @field_validator('first_name', 'last_name', 'emergency_contact_name')
    @classmethod
    def validate_name_format(cls, v: str) -> str:
        if any(char.isdigit() for char in v):
            raise ValueError("Name must not contain numbers")
        if not any(char.isalpha() for char in v):
            raise ValueError("Name must contain letters")
        return v

    @field_validator('phone_number', 'emergency_contact_phone')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Phone number must contain digits only")
        if len(v) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_dob_not_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

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

    @field_validator('first_name', 'last_name', 'address', 'emergency_contact_name')
    @classmethod
    def sanitize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = sanitize_text(v)
        if not cleaned or not cleaned.strip():
            raise ValueError("This field cannot be empty or contain only spaces")
        return cleaned

    @field_validator('first_name', 'last_name', 'emergency_contact_name')
    @classmethod
    def validate_name_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if any(char.isdigit() for char in v):
            raise ValueError("Name must not contain numbers")
        if not any(char.isalpha() for char in v):
            raise ValueError("Name must contain letters")
        return v

    @field_validator('phone_number', 'emergency_contact_phone')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError("Phone number must contain digits only")
        if len(v) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_dob_not_future(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        if v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

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


class PatientResponse(BaseModel):
    """Output schema — deliberately has NO strict validators, so existing
    records that predate current validation rules (e.g. old phone number
    formats) can still be read and displayed without crashing."""
    id: UUID
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    phone_number: str
    email: Optional[EmailStr] = None
    address: str
    emergency_contact_name: str
    emergency_contact_phone: str
    blood_group: Optional[str] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)