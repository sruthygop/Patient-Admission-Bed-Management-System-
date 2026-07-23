# Patient Admission & Bed Management System (PABMS) - Requirements Document

## 1. Project Overview
PABMS is a comprehensive web-based application designed for hospitals to manage the entire lifecycle of patient admissions, room/bed allocations, medical staff assignments, and discharge operations. It replaces manual/paper-based tracking with a digital, audit-logged workflow to optimize hospital resource utilization.

---

## 2. System Actors & Roles
The system supports three user roles:
1. **Admin**: Manages system users (doctors, staff, admin), handles configuration of wards, rooms, and beds, and views global reports and system audit logs.
2. **Doctor**: Reviews assigned patients, inputs medical notes, recommends admissions/discharges, and monitors patient vitals and bed history.
3. **Staff (Nurse/Receptionist)**: Registers patients, handles admission check-in, allocates beds, updates status (cleaning, maintenance), manages patient details, and processes discharges.

---

## 3. Core Modules

### 3.1. Authentication & User Management
- Secure user registration and login utilizing JWT (JSON Web Tokens).
- Role-based Access Control (RBAC) to restrict endpoints and frontend views.
- Active/Inactive account management by Admin.

### 3.2. Patient Management
- Register new patients with demographic details (name, DOB, gender, contact, emergency info, blood group).
- Search and filter patients by name, phone, or ID.
- Maintain historical records of previous admissions.

### 3.3. Bed & Room Management
- Hierarchical structure: **Wards** -> **Rooms** -> **Beds**.
- Support different ward types (e.g., ICU, General, Private, Pediatrics).
- Real-time status tracking for beds:
  - `available` (ready for patient)
  - `occupied` (patient admitted)
  - `maintenance` (bed needs repair or cleaning)
- Real-time bed occupancy dashboard.

### 3.4. Admission & Discharge Management
- Admit patients: Assign an available bed, record admission timestamp, specify reason, and link primary doctor.
- Prevent double-booking: A bed can only be assigned to one active patient.
- Discharge patients: Record discharge timestamp, release the bed (updating status to `available` or `maintenance`), and update admission status to `discharged`.

### 3.5. Doctor & Staff Assignment
- Assign one or more Doctors to an active admission.
- Assign Staff (nurses/receptionists) to specific Wards/Rooms during shifts.
- Track history of all assignments.

### 3.6. Dashboard & Reports
- Key metrics: Total beds, occupied beds, vacancy rate, admissions today, discharges today.
- Visual breakdown: Bed occupancy by ward type.
- Active patients list with quick actions.

### 3.7. Audit Logs
- Automatically log critical system actions (e.g., admitting a patient, changing a bed status, discharging a patient).
- Store timestamp, user ID, action type, modified entity, and JSON payloads of old vs. new values.

---

## 4. Non-Functional Requirements
- **Security**: Password hashing using bcrypt. JWT authentication for API requests. CORS configured for authorized domains.
- **Reliability**: Use database constraints (foreign keys, uniqueness) to ensure data integrity.
- **Performance**: Use database indexes for fast searching (e.g. searching patients by name or checking bed status).

