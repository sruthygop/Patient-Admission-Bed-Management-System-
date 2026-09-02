from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.models.models import User
from app.core.audit import log_audit

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# ==================== PYDANTIC SCHEMAS ====================

class ProfileUpdate(BaseModel):
    first_name: str
    last_name: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class AdminPasswordReset(BaseModel):
    user_id: str
    new_password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    first_name: str
    last_name: str
    hospital_id: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

# ==================== HELPER DEPENDENCY ====================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ==================== AUTH & USER ENDPOINTS ====================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token = create_access_token(
        subject=user.username,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "email": user.email,
        "hospital_id": str(user.hospital_id) if user.hospital_id else None,
        "hospital_name": user.hospital.name if user.hospital else "Global"
    }


@router.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "hospital_id": str(current_user.hospital_id) if current_user.hospital_id else None,
        "hospital_name": current_user.hospital.name if current_user.hospital else "Global"
    }


@router.put("/profile")
def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    old_values = {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name
    }

    current_user.first_name = profile_data.first_name
    current_user.last_name = profile_data.last_name

    log_audit(
        db=db,
        user_id=current_user.id,
        action="USER_PROFILE_UPDATED",
        entity_name="users",
        entity_id=current_user.id,
        old_values=old_values,
        new_values={
            "first_name": profile_data.first_name,
            "last_name": profile_data.last_name
        },
        hospital_id=current_user.hospital_id
    )

    db.commit()
    db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "hospital_id": str(current_user.hospital_id) if current_user.hospital_id else None,
        "hospital_name": current_user.hospital.name if current_user.hospital else "Global"
    }


@router.put("/change-password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )

    current_user.password_hash = get_password_hash(password_data.new_password)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="USER_PASSWORD_CHANGED",
        entity_name="users",
        entity_id=current_user.id,
        old_values=None,
        new_values={"status": "password_changed"},
        hospital_id=current_user.hospital_id
    )

    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/doctors", response_model=list[dict])
def list_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User).filter(User.role == "doctor", User.is_active == True)
    
    if current_user.role != "super_admin":
        query = query.filter(User.hospital_id == current_user.hospital_id)
        
    doctors = query.all()
    return [
        {
            "id": str(doc.id),
            "first_name": doc.first_name,
            "last_name": doc.last_name,
            "email": doc.email
        }
        for doc in doctors
    ]


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allowed_roles = ["admin", "cmo", "super_admin"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only"
        )
    
    if current_user.role == "super_admin":
        users = db.query(User).all()
    else:
        users = db.query(User).filter(User.hospital_id == current_user.hospital_id).all()

    return [
        {
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "is_active": u.is_active,
            "hospital_id": str(u.hospital_id) if u.hospital_id else None,
            "hospital_name": u.hospital.name if u.hospital else "Global"
        }
        for u in users
    ]


@router.post("/users/create")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only"
        )

    allowed_roles = ["admin", "doctor", "nurse", "receptionist", "cmo"]
    if user_data.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles: {', '.join(allowed_roles)}"
        )

    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    if current_user.role == "super_admin":
        target_hospital_id = user_data.hospital_id
        if not target_hospital_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="super_admin must specify hospital_id when creating a user"
            )
    else:
        target_hospital_id = current_user.hospital_id

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        hospital_id=target_hospital_id,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action="USER_CREATED",
        entity_name="users",
        entity_id=new_user.id,
        old_values=None,
        new_values={
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "hospital_id": str(target_hospital_id) if target_hospital_id else None
        },
        hospital_id=target_hospital_id
    )

    db.commit()
    db.refresh(new_user)

    return {
        "id": str(new_user.id),
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role,
        "first_name": new_user.first_name,
        "last_name": new_user.last_name,
        "hospital_id": str(new_user.hospital_id) if new_user.hospital_id else None,
        "is_active": new_user.is_active,
        "message": f"User {new_user.username} created successfully"
    }


@router.put("/users/{user_id}")
def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if current_user.role != "super_admin" and user.hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update users belonging to another hospital"
        )

    old_values = {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "is_active": user.is_active
    }

    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name
    if user_data.role is not None:
        allowed_roles = ["admin", "doctor", "nurse", "receptionist", "cmo"]
        if user_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Allowed: {', '.join(allowed_roles)}"
            )
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    new_values = {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "is_active": user.is_active
    }

    log_audit(
        db=db,
        user_id=current_user.id,
        action="USER_UPDATED",
        entity_name="users",
        entity_id=user.id,
        old_values=old_values,
        new_values=new_values,
        hospital_id=user.hospital_id
    )

    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "message": "User updated successfully"
    }


@router.put("/admin/reset-password")
def admin_reset_password(
    reset_data: AdminPasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "cmo", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only"
        )
    user = db.query(User).filter(User.id == reset_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if current_user.role != "super_admin" and user.hospital_id != current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot reset password for users in another hospital"
        )

    if len(reset_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    user.password_hash = get_password_hash(reset_data.new_password)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="ADMIN_RESET_PASSWORD",
        entity_name="users",
        entity_id=user.id,
        old_values=None,
        new_values={"reset_target_username": user.username},
        hospital_id=user.hospital_id
    )

    db.commit()
    return {"message": f"Password reset successfully for {user.username}"}