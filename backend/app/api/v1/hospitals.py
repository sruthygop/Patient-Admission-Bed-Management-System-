from uuid import UUID
from datetime import datetime
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import openpyxl
from openpyxl.styles import Font, PatternFill
from app.core.audit import log_audit

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User
from app.schemas.hospital import HospitalCreate, HospitalUpdate, HospitalResponse
from app.schemas.pagination import PaginatedResponse
from app.crud.hospital import (
    create_hospital,
    get_hospitals,
    get_hospital,
    update_hospital
)

router = APIRouter()


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to enforce Super Admin role access."""
    # Handle both string comparison and Enum comparison safely
    role_value = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if role_value != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user


@router.post("/", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
def create_new_hospital(
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Create a new hospital (Super Admin only)."""
    new_hospital = create_hospital(db=db, hospital_data=hospital_data)

    log_audit(
        db=db,
        user_id=admin.id,
        action="HOSPITAL_CREATED",
        entity_name="hospitals",
        entity_id=new_hospital.id,
        old_values=None,
        new_values={
            "name": new_hospital.name,
            "code": new_hospital.code,
            "performed_by_name": f"{admin.first_name} {admin.last_name} ({admin.username})".strip()
        },
        hospital_id=None
    )
    db.commit()

    return new_hospital


@router.get("/", response_model=PaginatedResponse[HospitalResponse])
def list_hospitals(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Page size"),
    search: str = Query(None, description="Search by hospital name or code"),
    is_active: bool = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """List all hospitals (Super Admin only), paginated, with optional search/filter."""
    skip = (page - 1) * page_size
    hospitals, total = get_hospitals(db=db, skip=skip, limit=page_size, search=search, is_active=is_active)
    return PaginatedResponse(items=hospitals, total_count=total, page=page, page_size=page_size)


@router.get("/export/excel")
def export_hospitals_excel(
    search: str = Query(None, description="Search by hospital name or code"),
    is_active: bool = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Export all hospitals (matching optional filters) as an Excel file."""
    hospitals, _ = get_hospitals(db=db, skip=0, limit=100000, search=search, is_active=is_active)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Hospitals"

    headers = ["Name", "Code", "Address", "Phone", "Email", "Status", "Created At"]
    ws.append(headers)
    header_fill = PatternFill(start_color="16A34A", end_color="16A34A", fill_type="solid")
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = header_fill

    for h in hospitals:
        ws.append([
            h.name,
            h.code,
            h.address or "",
            h.phone or "",
            h.email or "",
            "Active" if h.is_active else "Inactive",
            h.created_at.strftime("%Y-%m-%d %H:%M") if h.created_at else ""
        ])

    for column_cells in ws.columns:
        max_length = max(len(str(cell.value)) if cell.value else 0 for cell in column_cells)
        ws.column_dimensions[column_cells[0].column_letter].width = max_length + 4

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"hospitals_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital_detail(
    hospital_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Get a single hospital's details (Super Admin only)."""
    hospital = get_hospital(db=db, hospital_id=hospital_id)
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    return hospital


@router.put("/{hospital_id}", response_model=HospitalResponse)
def update_hospital_details(
    hospital_id: UUID,
    update_data: HospitalUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Update hospital name or active status (Super Admin only)."""
    existing = get_hospital(db=db, hospital_id=hospital_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    old_values = {
        "name": existing.name,
        "is_active": existing.is_active,
        "phone": existing.phone,
        "email": existing.email,
    }

    updated_hospital = update_hospital(db=db, hospital_id=hospital_id, update_data=update_data)

    log_audit(
        db=db,
        user_id=admin.id,
        action="HOSPITAL_UPDATED",
        entity_name="hospitals",
        entity_id=updated_hospital.id,
        old_values=old_values,
        new_values={
            "name": updated_hospital.name,
            "is_active": updated_hospital.is_active,
            "phone": updated_hospital.phone,
            "email": updated_hospital.email,
            "performed_by_name": f"{admin.first_name} {admin.last_name} ({admin.username})".strip()
        },
        hospital_id=None
    )
    db.commit()

    return updated_hospital