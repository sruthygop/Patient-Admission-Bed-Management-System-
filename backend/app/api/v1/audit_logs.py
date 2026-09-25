from sqlalchemy import or_
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, AuditLog, Hospital
from app.schemas.pagination import PaginatedResponse

router = APIRouter()

def check_role(current_user: User, allowed_roles: list):
    extended_roles = allowed_roles + ["super_admin"]
    if current_user.role not in extended_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
        )

@router.get("/")
def get_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Page size"),
    search: str = Query(None, description="Search by action, entity, or performed-by user"),
    action: str = Query(None, description="Filter by exact action"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_role(current_user, ["admin"])

    query = (
        db.query(AuditLog)
        .outerjoin(User, AuditLog.user_id == User.id)
        .outerjoin(Hospital, AuditLog.hospital_id == Hospital.id)
        .order_by(desc(AuditLog.timestamp))
    )

    if current_user.role != "super_admin":
        query = query.filter(AuditLog.hospital_id == current_user.hospital_id)

    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)

    if search:
        search_tokens = search.strip().split()
        search_term = f"%{'%'.join(search_tokens)}%" if search_tokens else f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(search_term),
                AuditLog.entity_name.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.username.ilike(search_term),
                Hospital.name.ilike(search_term),
            )
        )

    total_count = query.count()
    skip = (page - 1) * page_size
    logs = query.offset(skip).limit(page_size).all()

    items = []
    for log in logs:
        items.append({
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "hospital_id": str(log.hospital_id) if log.hospital_id else None,
            "action": log.action,
            "entity_name": log.entity_name,
            "entity_id": str(log.entity_id),
            "old_values": log.old_values,
            "new_values": log.new_values,
            "timestamp": log.timestamp.isoformat()
        })

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }