# SettlementSense — Patient Admission & Bed Management System (PABMS)

A full-stack, multi-hospital (multi-tenant) hospital bed and patient admission management system built with **React.js** and **FastAPI**.
Handles end-to-end patient lifecycle: registration, admission, bed allocation, doctor assignment, staff scheduling, prescriptions, 
and audit logging — across multiple hospitals with full data isolation between tenants.

---

## What's Inside

### Pages

| Route | Description |
|---|---|
| `/login` | Email-based login for all roles |
| `/dashboard` | Real-time hospital overview — occupancy, trends, ward breakdown (hospital-scoped) |
| `/super-admin-dashboard` | Multi-hospital global overview — cross-tenant metrics, system health, aggregate stats (Super Admin only) |
| `/patients` | Patient registry — register, search, update, delete |
| `/beds` | Bed and admission control — admit, discharge, manage wards, rooms, and beds |
| `/doctor-assignments` | Assign and manage doctors for active admissions |
| `/staff-assignments` | Assign nurses and staff to wards for shifts |
| `/prescriptions` | Digital prescriptions for admitted patients |
| `/analytics` | Clinical and operational analytics hub |
| `/user-management` | Manage system users (Admin, Super Admin) |
| `/audit-logs` | Full system activity history (Admin only; global cross-hospital view for Super Admin) |
| `/hospitals` | Hospital management — onboard and manage hospital tenants (Super Admin only) |

### API Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Auth & Users** | `POST` | `/api/v1/auth/login` | Authenticate user, returns JWT |
| | `GET` | `/api/v1/auth/me` | Get current logged-in user info |
| | `PUT` | `/api/v1/auth/profile` | Update own name |
| | `PUT` | `/api/v1/auth/change-password` | Change own password |
| | `GET` | `/api/v1/auth/doctors` | List doctors available in active tenant |
| | `GET` | `/api/v1/auth/users` | Get all system users |
| | `POST` | `/api/v1/auth/users/create` | Create a new system user |
| | `PUT` | `/api/v1/auth/users/{user_id}` | Update existing user details |
| | `PUT` | `/api/v1/auth/admin/reset-password` | Admin resets any user's password |
| **Hospitals** | `POST` | `/api/v1/hospitals/` | Create a new hospital tenant (Super Admin only) |
| | `GET` | `/api/v1/hospitals/` | List all hospitals (Super Admin only) |
| | `GET` | `/api/v1/hospitals/{hospital_id}` | Get hospital detail (Super Admin only) |
| | `PUT` | `/api/v1/hospitals/{hospital_id}` | Update hospital details (Super Admin only) |
| **Patients** | `POST` | `/api/v1/patients/` | Register a new patient |
| | `GET` | `/api/v1/patients/` | List patients with search and filter |
| | `GET` | `/api/v1/patients/{patient_id}` | Read single patient details |
| | `PUT` | `/api/v1/patients/{patient_id}` | Update patient details |
| | `DELETE` | `/api/v1/patients/{patient_id}` | Soft delete a patient |
| **Beds & Wards** | `POST` | `/api/v1/beds/wards` | Add a new ward |
| | `GET` | `/api/v1/beds/wards` | List all wards |
| | `GET` | `/api/v1/beds/wards/occupancy` | Get ward occupancy rates |
| | `POST` | `/api/v1/beds/rooms` | Add a new room |
| | `GET` | `/api/v1/beds/wards/{ward_id}/rooms` | List rooms within a specific ward |
| | `GET` | `/api/v1/beds/beds` | List all beds |
| | `POST` | `/api/v1/beds/beds` | Add a new bed |
| | `PUT` | `/api/v1/beds/{bed_id}/status` | Change bed status |
| **Admissions** | `POST` | `/api/v1/admissions/` | Admit a patient to a bed |
| | `POST` | `/api/v1/admissions/{admission_id}/discharge` | Discharge a patient |
| | `GET` | `/api/v1/admissions/active` | List all active admissions |
| | `GET` | `/api/v1/admissions/{admission_id}` | Read admission detail |
| | `GET` | `/api/v1/admissions/history/{patient_id}` | Get admission history for a patient |
| **Dashboard** | `GET` | `/api/v1/dashboard/stats` | Real-time dashboard statistics |
| **Audit Logs** | `GET` | `/api/v1/audit-logs/` | Full audit history (admin only; global for Super Admin) |
| **Doctor Assignments** | `GET` | `/api/v1/doctor-assignments/doctors/list` | Get list of doctors for assignment |
| | `GET` | `/api/v1/doctor-assignments/{admission_id}` | Get doctor assignments for an admission |
| | `POST` | `/api/v1/doctor-assignments/` | Assign doctor to an admission |
| | `DELETE` | `/api/v1/doctor-assignments/{assignment_id}` | Unassign a doctor |
| **Staff Assignments** | `GET` | `/api/v1/staff-assignments/` | Get ward staff assignments |
| | `POST` | `/api/v1/staff-assignments/` | Assign staff to a ward |
| | `DELETE` | `/api/v1/staff-assignments/{assignment_id}` | Remove staff assignment |
| **Analytics** | `GET` | `/api/v1/analytics/stats` | Get clinical & operational analytics |
| **Prescriptions** | `POST` | `/api/v1/prescriptions/` | Create a prescription |
| | `GET` | `/api/v1/prescriptions/admission/{admission_id}` | List prescriptions by admission |
| | `GET` | `/api/v1/prescriptions/patient/{patient_id}` | List prescriptions by patient |
| | `DELETE` | `/api/v1/prescriptions/{prescription_id}` | Deactivate a prescription |

### Key Features

- **Multi-Hospital Support** — full multi-tenant architecture; each hospital's data (patients, beds, wards, admissions, staff) is isolated from every other hospital.
- **Super Admin Executive Dashboard** — global overview page providing aggregate capacity, tenant counts, cross-hospital statistics, and system-wide activity tracking.
- **Patient Management** — register, search, update, and soft-delete patient records.
- **Bed Management** — ward, room, and bed hierarchy with real-time status tracking and capacity enforcement.
- **Admission Lifecycle** — admit patients to beds, assign doctors separately, discharge with automatic bed status update.
- **Doctor Assignment** — assign, reassign, and unassign doctors to active admissions separately from admission flow.
- **Staff Scheduling** — assign nurses and staff to wards for shifts.
- **Digital Prescriptions** — doctors and CMO can write and manage prescriptions for admitted patients.
- **Analytics Hub** — monthly trends, gender distribution, blood group breakdown, ward performance analysis.
- **Role-Based Access Control** — six roles (Super Admin, Admin, CMO, Doctor, Nurse, Receptionist) with fine-grained permissions per the RBAC matrix.
- **Audit Logging** — every system action is tracked with who performed it, when, and at which hospital; Super Admin has a global cross-hospital view.
- **Real-Time Dashboards** — occupancy rates, admission trends, ward breakdown, and recent admissions.
- **JWT Authentication** — all API routes are protected with JWT tokens.
- **Profile Settings** — users can update their name and change their own password.
- **Admin Tools** — admins and super admin  can reset passwords and manage system users.
- **User Management** — admins and super admin can add, edit, activate, and deactivate system users through the UI.
- **Hospital Tenant Management** — Super Admin can onboard new hospital tenants and manage existing ones.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18 |
| Styling | Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT (JSON Web Tokens) |
| API Documentation | Swagger UI (auto-generated) |

---

## Role-Based Access Control

| Feature | Super Admin | Admin | CMO | Doctor | Nurse | Receptionist |
|---|---|---|---|---|---|---|
| Hospital Dashboard | Full access (all hospitals) | Full access | Full access | View only | View only | View only |
| Super Admin Dashboard | Full access | No access | No access | No access | No access | No access |
| Patient Management | Full access (all hospitals) | Full access | Register/update | View only | Register/update | Register only |
| Bed and Admissions | Full access (all hospitals) | Full access | Admit/discharge | Admit/discharge | Admit/discharge | View only |
| Doctor Assignments | Full access | Full access | Assign/unassign | View only | Assign/unassign | View only |
| Staff Assignments | Full access | Full access | Manage | View only | View only | View only |
| Prescriptions | View only | View only | Write/manage | Write/manage | View only | View only |
| Analytics | Full access (all hospitals) | Full access | Full access | Full access | Full access | Full access |
| User Management | Full access (all hospitals) | Full access | No access | No access | No access | No access |
| Audit Logs | Full access — global, all hospitals | Full access — own hospital | No access | No access | No access | No access |
| Ward/Room/Bed Management | Full access | Full access | No access | No access | No access | No access |
| Hospital Management | Full access | No access | No access | No access | No access | No access |
| Profile Settings | Full access | Full access | Own profile | Own profile | Own profile | Own profile |

---

## Prerequisites

Before running locally, make sure you have:

- [Node.js 18+](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/)
- [PostgreSQL 14+](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

---

## Local Setup — Step by Step

### Step 1 — Clone the repo

```bash
git clone [https://github.com/YOUR_USERNAME/pabms.git](https://github.com/YOUR_USERNAME/pabms.git)
cd pabms
```

### Step 2 — Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3 — Create the database

Open psql and run:

``SQL
CREATE DATABASE project_db;
CREATE USER devuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE project_db TO devuser;
GRANT ALL ON SCHEMA public TO devuser;
```

### Step 4 — Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:


```env
DATABASE_URL=postgresql://devuser:YOUR_PASSWORD@localhost:5432/project_db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

>To generate a secure secret key, run:

>```bash
> openssl rand -hex 32
> ``` 

### Step 5 — Initialize the database and seed data

```bash
python -m app.db_init
```
This creates all tables and seeds a Super Admin plus default users for two demo hospitals (Settlement Sense Hospital and Metro Care Hospital).

### Step 6 — Start the backend

```bash
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### Step 7 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

```

## Default Login Credentials

Name	                    Email	           Role	               Hospital
Super Admin	        superadmin@pabms.com	Super Admin	      — (global)
System Administrator	admin@pabms.com	Admin	Settlement Sense       (SS-001)
Robert Wilson (CMO)	cmo@pabms.com	CMO	Settlement Sense        (SS-001)
Dr. John Smith	        smith@pabms.com	Doctor	Settlement Sense        (SS-001)
Dr. Sarah Jones	        jones@pabms.com	Doctor	Settlement Sense        (SS-001)
Mary Johnson	        mary@pabms.com	Nurse	Settlement Sense         (SS-001)
John Williams	        john.nurse@pabms.com	Nurse Settlement Sense   (SS-001)
Priya Nair	        priya@pabms.com	Nurse	Settlement Sense         (SS-001)
Jane Doe	        reception@pabms.com	ReceptionistSettlement Sense (SS-001)
Metro Admin	        admin@metrocare.com	Admin	Metro Care       (MCH-002)
Dr. Alex Brown	        doctor@metrocare.com	Doctor	Metro Care       (MCH-002)
Lisa Green	        nurse@metrocare.com	Nurse	Metro Care       (MCH-002)

>Default credentials are set during database initialization via db_init.py. 
 Please change all passwords after first login in a production environment.

```

## Database Schema

The system uses 11 tables:

Table	           Description

hospitals	     Hospital tenants — each row is a separate hospital in the system
users	             System users with roles (super_admin, admin, cmo, doctor, nurse, receptionist), scoped to a hospital
patients	     Patient records with soft delete, scoped to a hospital
wards	             Hospital wards, scoped to a hospital
rooms	             Rooms within wards
beds	             Beds within rooms with status tracking
admissions	     Patient admission records
doctor_assignments   Doctor to admission assignments
staff_assignments    Staff to ward shift assignments
prescriptions	     Medication prescriptions tied to an admission
audit_logs	     Complete system activity history, scoped to a hospital (Super Admin sees all) 

```

## Documentation

The `docs/` folder contains supporting project documents:

File	                Description

docs/requirements.md	Full system requirements document covering modules, roles, and non-functional requirements
docs/schema.sql	        Complete PostgreSQL database schema reflecting the current live database
docs/ER Diagram	        Entity Relationship diagram showing all tables and their relationships

```

##Environment Variables

Variable	            Required	          Description

DATABASE_URL	             Yes	       PostgreSQL connection string
SECRET_KEY	             Yes	       JWT signing secret key
ALGORITHM	             Yes	       JWT algorithm (HS256)
ACCESS_TOKEN_EXPIRE_MINUTES  Yes	       Token expiry in minutes
PROJECT_NAME	             No   	       Application display name
API_V1_STR	             No	               API version prefix


```