# SettlementSense — Patient Admission & Bed Management System (PABMS)

A full-stack hospital bed and patient admission management system built with **React.js** and **FastAPI**.
Handles end-to-end patient lifecycle: registration, admission, bed allocation, doctor assignment, staff scheduling, and audit logging.

---

## What's Inside

### Pages

 || Route | Description |
|---|---|
| `/login` | Email-based login for all roles |
| `/dashboard` | Real-time hospital overview — occupancy, trends, ward breakdown |
| `/patients` | Patient registry — register, search, update, delete |
| `/beds` | Bed and admission control — admit, discharge, manage wards |
| `/doctor-assignments` | Assign and manage doctors for active admissions |
| `/staff-assignments` | Assign nurses and staff to wards for shifts |
| `/prescriptions` | Digital prescriptions for admitted patients |
| `/analytics` | Clinical and operational analytics hub |
| `/user-management` | Manage system users (admin only) |
| `/audit-logs` | Full system activity history (admin only) |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user, returns JWT |
| `GET` | `/api/v1/auth/me` | Get current logged-in user info |
| `PUT` | `/api/v1/auth/profile` | Update own name |
| `PUT` | `/api/v1/auth/change-password` | Change own password |
| `PUT` | `/api/v1/auth/admin/reset-password` | Admin resets any user's password |
| `GET` | `/api/v1/patients/` | List all patients with search and filter |
| `POST` | `/api/v1/patients/` | Register a new patient |
| `PUT` | `/api/v1/patients/{id}` | Update patient details |
| `DELETE` | `/api/v1/patients/{id}` | Soft delete a patient |
| `GET` | `/api/v1/beds/wards` | List all wards with rooms and beds |
| `POST` | `/api/v1/beds/wards` | Create a new ward |
| `POST` | `/api/v1/beds/rooms` | Create a new room |
| `POST` | `/api/v1/beds/beds` | Create a new bed |
| `PUT` | `/api/v1/beds/{id}/status` | Update bed status |
| `GET` | `/api/v1/admissions/active` | List all active admissions |
| `POST` | `/api/v1/admissions/` | Admit a patient to a bed |
| `POST` | `/api/v1/admissions/{id}/discharge` | Discharge a patient |
| `GET` | `/api/v1/doctor-assignments/` | List all doctor assignments |
| `POST` | `/api/v1/doctor-assignments/` | Assign a doctor to an admission |
| `DELETE` | `/api/v1/doctor-assignments/{id}` | Unassign a doctor |
| `GET` | `/api/v1/staff-assignments/` | List all staff assignments |
| `POST` | `/api/v1/staff-assignments/` | Assign staff to a ward |
| `DELETE` | `/api/v1/staff-assignments/{id}` | Remove a staff assignment |
| `GET` | `/api/v1/dashboard/stats` | Real-time dashboard statistics |
| `GET` | `/api/v1/audit-logs/` | Full audit history (admin only) |

### Key Features

- **Patient Management** — register, search, update, and soft-delete patient records
- **Bed Management** — ward, room, and bed hierarchy with real-time status tracking
- **Admission Lifecycle** — admit patients to beds, assign doctors separately, discharge with automatic bed status update
- **Doctor Assignment** — assign, reassign, and unassign doctors to active admissions separately from admission flow
- **Staff Scheduling** — assign nurses and staff to wards for shifts
- **Digital Prescriptions** — doctors and CMO can write and manage prescriptions for admitted patients
- **Analytics Hub** — monthly trends, gender distribution, blood group breakdown, ward performance analysis
- **Role-Based Access Control** — five roles (Admin, CMO, Doctor, Nurse, Receptionist) with fine-grained permissions per the RBAC matrix
- **Audit Logging** — every system action is tracked with who performed it and when
- **Real-Time Dashboard** — occupancy rates, admission trends, ward breakdown, recent admissions
- **JWT Authentication** — all API routes are protected with JWT tokens
- **Profile Settings** — users can update their name and change their own password
- **Admin Tools** — admin can reset any user's password and manage all system users
- **User Management** — admin can add, edit, activate and deactivate system users through the UI

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
| Feature | Admin | CMO | Doctor | Nurse | Receptionist |
|---|---|---|---|---|---|
| Dashboard | Full access | Full access | View only | View only | View only |
| Patient Management | Full access | Register/update | View only | Register/update | Register only |
| Bed and Admissions | Full access | Admit/discharge | Admit/discharge | Admit/discharge | View only |
| Doctor Assignments | Full access | Assign/unassign | View only | Assign/unassign | View only |
| Staff Assignments | Full access | Manage | View only | View only | View only |
| Prescriptions | View only | Write/manage | Write/manage | View only | View only |
| Analytics | Full access | Full access | Full access | Full access | Full access |
| User Management | Full access | No access | No access | No access | No access |
| Audit Logs | Full access | No access | No access | No access | No access |
| Ward/Room/Bed Management | Full access | No access | No access | No access | No access |
| Profile Settings | Full access | Own profile | Own profile | Own profile | Own profile |
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
git clone https://github.com/YOUR_USERNAME/pabms.git
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

```sql
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

> To generate a secure secret key, run:
> ```bash
> openssl rand -hex 32
> ```

### Step 5 — Initialize the database and seed data

```bash
python app/db_init.py
```

This creates all tables and seeds 7 default users.

### Step 6 — Start the backend

```bash
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
API Documentation: **http://localhost:8000/docs**

### Step 7 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Default Login Credentials

| Name | Email | Role |
|---|---|---|
| System Administrator | admin@pabms.com | Admin |
| Dr. John Smith | smith@pabms.com | Doctor |
| Dr. Sarah Jones | jones@pabms.com | Doctor |
| Robert Wilson (CMO) | cmo@pabms.com | CMO |
| Jane Doe | reception@pabms.com | Receptionist |
| Mary Johnson | mary@pabms.com | Nurse |
| John Williams | john.nurse@pabms.com | Nurse |
| Priya Nair | priya@pabms.com | Nurse |

> Default credentials are set during database initialization via `db_init.py`. Please change all passwords after first login in a production environment.

---

## Database Schema

The system uses 9 tables:

| Table | Description |
|---|---|
| `users` | System users with roles (admin, doctor, staff) |
| `patients` | Patient records with soft delete |
| `wards` | Hospital wards |
| `rooms` | Rooms within wards |
| `beds` | Beds within rooms with status tracking |
| `admissions` | Patient admission records |
| `doctor_assignments` | Doctor to admission assignments |
| `staff_assignments` | Staff to ward shift assignments |
| `audit_logs` | Complete system activity history |

---

## Documentation

The `docs/` folder contains supporting project documents:

| File | Description |
|---|---|
| `docs/requirements.md` | Full system requirements document covering modules, roles, and non-functional requirements |
| `docs/schema.sql` | Complete PostgreSQL database schema with all 9 tables |
| `docs/ER Diagram` | Entity Relationship diagram showing all 9 tables and their relationships |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing secret key |
| `ALGORITHM` | Yes | JWT algorithm (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | Token expiry in minutes |
| `PROJECT_NAME` | No | Application display name |
| `API_V1_STR` | No | API version prefix |

---

