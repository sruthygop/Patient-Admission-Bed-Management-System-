from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator

# --- Bed Schemas ---
class BedBase(BaseModel):
    bed_number: str = Field(..., max_length=10)

class BedCreate(BedBase):
    room_id: UUID

class BedStatusUpdate(BaseModel):
    status: str = Field(..., description="Status must be 'available', 'occupied', or 'maintenance'")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        v_lower = v.lower()
        if v_lower not in ['available', 'occupied', 'maintenance']:
            raise ValueError("Status must be 'available', 'occupied', or 'maintenance'")
        return v_lower

class BedResponse(BedBase):
    id: UUID
    room_id: UUID
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Room Schemas ---
class RoomBase(BaseModel):
    room_number: str = Field(..., max_length=10)
    room_type: str = Field(..., max_length=30, description="e.g. Private, Semi-Private, General")

class RoomCreate(RoomBase):
    ward_id: UUID

class RoomResponse(RoomBase):
    id: UUID
    ward_id: UUID
    created_at: datetime
    beds: List[BedResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Ward Schemas ---
class WardBase(BaseModel):
    name: str = Field(..., max_length=50)
    type: str = Field(..., max_length=30, description="e.g. ICU, General, Pediatrics, Maternity")
    capacity: int = Field(..., gt=0)

class WardCreate(WardBase):
    pass

class WardResponse(WardBase):
    id: UUID
    created_at: datetime
    rooms: List[RoomResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard / Occupancy response ---
class WardOccupancyResponse(BaseModel):
    ward_id: UUID
    ward_name: str
    ward_type: str
    capacity: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    maintenance_beds: int
    occupancy_rate: float # Percentage
