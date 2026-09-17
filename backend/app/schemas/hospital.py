from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator
from app.core.sanitize import sanitize_text


class HospitalCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None

    @field_validator('name', 'code', 'address', 'phone', 'email', 'logo_url')
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v)


class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None

    @field_validator('name', 'address', 'phone', 'email', 'logo_url')
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v)


class HospitalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    created_at: datetime