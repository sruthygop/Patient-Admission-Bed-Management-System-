import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Date, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="hospital")
    wards = relationship("Ward", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")
    rooms = relationship("Room", back_populates="hospital")
    beds = relationship("Bed", back_populates="hospital")
    admissions = relationship("Admission", back_populates="hospital")
    prescriptions = relationship("Prescription", back_populates="hospital")
    audit_logs = relationship("AuditLog", back_populates="hospital")
    doctor_assignments = relationship("DoctorAssignment", back_populates="hospital")
    staff_assignments = relationship("StaffAssignment", back_populates="hospital")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    doctor_assignments = relationship("DoctorAssignment", back_populates="doctor")
    staff_assignments = relationship("StaffAssignment", back_populates="staff")
    prescriptions = relationship("Prescription", back_populates="prescribed_by_user")
    hospital = relationship("Hospital", back_populates="users")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    first_name = Column(String(50), nullable=False, index=True)
    last_name = Column(String(50), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)
    phone_number = Column(String(15), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=False)
    emergency_contact_name = Column(String(100), nullable=False)
    emergency_contact_phone = Column(String(15), nullable=False)
    blood_group = Column(String(5), nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    admissions = relationship("Admission", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")
    hospital = relationship("Hospital", back_populates="patients")


class Ward(Base):
    __tablename__ = "wards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    name = Column(String(50), nullable=False)
    type = Column(String(30), nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    rooms = relationship("Room", back_populates="ward", cascade="all, delete-orphan")
    staff_assignments = relationship("StaffAssignment", back_populates="ward", cascade="all, delete-orphan")
    hospital = relationship("Hospital", back_populates="wards")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    ward_id = Column(UUID(as_uuid=True), ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(10), nullable=False)
    room_type = Column(String(30), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    ward = relationship("Ward", back_populates="rooms")
    beds = relationship("Bed", back_populates="room", cascade="all, delete-orphan")
    hospital = relationship("Hospital", back_populates="rooms")


class Bed(Base):
    __tablename__ = "beds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    bed_number = Column(String(10), nullable=False)
    status = Column(String(20), nullable=False, default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    room = relationship("Room", back_populates="beds")
    admissions = relationship("Admission", back_populates="bed")
    hospital = relationship("Hospital", back_populates="beds")


class Admission(Base):
    __tablename__ = "admissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    bed_id = Column(UUID(as_uuid=True), ForeignKey("beds.id", ondelete="SET NULL"), nullable=True)
    admission_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    discharge_date = Column(DateTime(timezone=True), nullable=True)
    reason_for_admission = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="admitted")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="admissions")
    bed = relationship("Bed", back_populates="admissions")
    doctor_assignments = relationship("DoctorAssignment", back_populates="admission", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="admission")
    hospital = relationship("Hospital", back_populates="admissions")


class DoctorAssignment(Base):
    __tablename__ = "doctor_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    admission_id = Column(UUID(as_uuid=True), ForeignKey("admissions.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    unassigned_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    admission = relationship("Admission", back_populates="doctor_assignments")
    doctor = relationship("User", back_populates="doctor_assignments")
    hospital = relationship("Hospital", back_populates="doctor_assignments")


class StaffAssignment(Base):
    __tablename__ = "staff_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    ward_id = Column(UUID(as_uuid=True), ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shift_start = Column(DateTime(timezone=True), nullable=False)
    shift_end = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    ward = relationship("Ward", back_populates="staff_assignments")
    staff = relationship("User", back_populates="staff_assignments")
    hospital = relationship("Hospital", back_populates="staff_assignments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    hospital = relationship("Hospital", back_populates="audit_logs")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    admission_id = Column(UUID(as_uuid=True), ForeignKey("admissions.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    prescribed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    duration = Column(String(100), nullable=False)
    instructions = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    prescribed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    admission = relationship("Admission", back_populates="prescriptions")
    patient = relationship("Patient", back_populates="prescriptions")
    prescribed_by_user = relationship("User", back_populates="prescriptions")
    hospital = relationship("Hospital", back_populates="prescriptions")