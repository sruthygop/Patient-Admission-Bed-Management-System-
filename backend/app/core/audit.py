from typing import Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.models import AuditLog

def log_audit(
    db: Session,
    user_id: Optional[UUID],
    action: str,
    entity_name: str,
    entity_id: UUID,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    hospital_id: Optional[UUID] = None
) -> AuditLog:
    """
    Creates an audit log entry in the database.
    Does not call db.commit() to ensure the log is saved as part of the main transaction.
    """
    db_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_name=entity_name,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        hospital_id=hospital_id
    )
    db.add(db_log)
    return db_log