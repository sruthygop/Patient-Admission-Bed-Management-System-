from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, AuditLog

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
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin sees hospital audit logs
    # Super Admin sees ALL audit logs across all hospitals
    check_role(current_user, ["admin"])

    query = db.query(AuditLog).order_by(desc(AuditLog.timestamp))

    # Super admin sees all logs across all hospitals
    if current_user.role != "super_admin":
        query = query.filter(
            AuditLog.hospital_id == current_user.hospital_id
        )

    logs = query.offset(skip).limit(limit).all()

    result = []
    for log in logs:
        result.append({
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
    return result