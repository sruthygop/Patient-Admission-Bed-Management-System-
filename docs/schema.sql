-- =========================================================
-- PABMS (Patient Admission & Bed Management System) Schema
-- Multi-Hospital / Multi-Tenant Version
-- =========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- Hospitals Table (Tenants)
-- =========================================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    logo_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Users Table (Super Admin, Hospital Admin, Doctors, Staff, Nurses, Receptionists, CMO)
-- Note: role has no CHECK constraint at the database level.
-- Valid roles enforced at the application layer:
--   'super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'cmo'
-- super_admin has hospital_id = NULL (global, not tied to a single hospital)
-- =========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Patients Table
-- =========================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(100) NULL,
    address TEXT NOT NULL,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(15) NOT NULL,
    blood_group VARCHAR(5) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Wards Table
-- Ward name is unique per hospital (not globally unique) —
-- two different hospitals may each have their own "ICU" or
-- "Maternity Ward".
-- =========================================================
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wards_name_hospital_unique UNIQUE (name, hospital_id)
);

-- =========================================================
-- Rooms Table
-- =========================================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    room_number VARCHAR(10) NOT NULL,
    room_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- NOTE: room_number uniqueness within a ward is enforced only
    -- at the application layer (crud/bed.py), not by a database
    -- constraint. No UNIQUE(ward_id, room_number) exists in the
    -- live database as of this writing.
);

-- =========================================================
-- Beds Table
-- =========================================================
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- NOTE: bed_number uniqueness within a room, and valid status
    -- values ('available', 'occupied', 'maintenance'), are enforced
    -- only at the application layer (crud/bed.py), not by database
    -- constraints. No UNIQUE(room_id, bed_number) or status CHECK
    -- exists in the live database as of this writing.
);

-- =========================================================
-- Admissions Table
-- =========================================================
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP WITH TIME ZONE NULL,
    reason_for_admission TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- NOTE: valid status values ('admitted', 'discharged') are
    -- enforced only at the application layer, not by a database
    -- CHECK constraint.
);

-- =========================================================
-- Doctor Assignments Table
-- =========================================================
CREATE TABLE doctor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITH TIME ZONE NULL,
    notes TEXT NULL
);

-- =========================================================
-- Staff Assignments Table
-- =========================================================
CREATE TABLE staff_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Audit Logs Table
-- hospital_id is NULL for actions with no specific hospital
-- context (e.g. certain super_admin actions).
-- =========================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Prescriptions Table
-- =========================================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NULL REFERENCES hospitals(id),
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescribed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT NULL,
    is_active BOOLEAN NOT NULL,
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Indexes
-- Reflects what actually exists in the live database as of
-- this writing. Only primary keys, unique constraints, and
-- the SQLAlchemy-generated indexes below are present.
-- =========================================================
CREATE INDEX ix_patients_first_name ON patients (first_name);
CREATE INDEX ix_patients_last_name ON patients (last_name);
CREATE INDEX ix_patients_phone_number ON patients (phone_number);

-- NOTE: No performance indexes currently exist on hospital_id
-- columns, or on beds.status, admissions.status,
-- doctor_assignments.admission_id, staff_assignments.ward_id,
-- audit_logs.timestamp, or prescriptions.admission_id /
-- patient_id, despite these being common filter/query columns
-- in a multi-hospital system. Worth adding if query performance
-- becomes a concern as data volume grows, e.g.:
--   CREATE INDEX idx_patients_hospital ON patients (hospital_id);
--   CREATE INDEX idx_beds_hospital ON beds (hospital_id);
--   CREATE INDEX idx_admissions_hospital ON admissions (hospital_id);
--   CREATE INDEX idx_admissions_status ON admissions (status);
--   CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);