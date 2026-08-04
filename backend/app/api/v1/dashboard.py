from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import User
from app.api.v1.auth import get_current_user
from app.schemas.dashboard import DashboardStatsResponse
from app.crud.dashboard import get_dashboard_stats

router = APIRouter()

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action forbidden. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "doctor", "cmo", "nurse", "receptionist"]))
):
    """
    Fetch comprehensive dashboard metrics.
    Accessible by all roles.
    """
    return get_dashboard_stats(db)