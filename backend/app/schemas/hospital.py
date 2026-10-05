import re
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.core.sanitize import sanitize_text


class HospitalCreate(BaseModel):
    name: str = Field(..., max_length=255)
    code: str = Field(..., max_length=50)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = Field(None, max_length=500)

    @field_validator('name', 'code', 'address', 'phone', 'logo_url')
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v)

    @field_validator('name', 'code')
    @classmethod
    def validate_required_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("This field cannot be empty or contain only spaces")
        return v

    @field_validator('code')
    @classmethod
    def validate_code_format(cls, v: str) -> str:
        if not re.match(r'^[A-Za-z0-9_-]+$', v):
            raise ValueError("Hospital code can only contain letters, numbers, hyphens, and underscores")
        return v.upper()

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        if not re.match(r'^\+?\d{7,15}$', v):
            raise ValueError("Phone number must contain 7-15 digits, with an optional leading +")
        return v

    @field_validator('logo_url')
    @classmethod
    def validate_logo_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        if v.startswith('data:'):
            raise ValueError("Logo URL must be a web link (e.g. https://...), not embedded image data")
        if not re.match(r'^https?://', v):
            raise ValueError("Logo URL must start with http:// or https://")
        return v


class HospitalUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = Field(None, max_length=500)

    @field_validator('name', 'address', 'phone', 'logo_url')
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v)

    @field_validator('name')
    @classmethod
    def validate_name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError("This field cannot be empty or contain only spaces")
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        if not re.match(r'^\+?\d{7,15}$', v):
            raise ValueError("Phone number must contain 7-15 digits, with an optional leading +")
        return v

    @field_validator('logo_url')
    @classmethod
    def validate_logo_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        if v.startswith('data:'):
            raise ValueError("Logo URL must be a web link (e.g. https://...), not embedded image data")
        if not re.match(r'^https?://', v):
            raise ValueError("Logo URL must start with http:// or https://")
        return v


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