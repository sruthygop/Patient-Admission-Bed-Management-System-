# PABMS User Manual
## Patient Admission & Bed Management System
### Settlement Sense — 2026

---

## 1. Introduction

The Patient Admission & Bed Management System (PABMS) is a web-based, multi-tenant hospital management platform developed for Settlement Sense. 
It enables healthcare facilities to manage patient registrations, bed allocations, ward admissions, discharges, doctor assignments, 
clinical prescriptions, and staff scheduling through a secure and professional interface.
Designed with **multi-tenant architecture**, PABMS ensures complete data isolation between different hospital 
organizations while providing executive-level oversight for Super Administrators.

---

## 2. Accessing the System

### Login

1. Open your web browser and navigate to the system URL (`http://localhost:5173` or your designated domain).
2. Enter your **Email Address** (e.g., `admin@pabms.com` or `superadmin@pabms.com`).
3. Enter your **Password**.
4. Click **Login**.

### Hospital Tenant Isolation
Every user account (except Super Admin) is bound to a specific hospital tenant (e.g., *Settlement Sense Hospital* or *Metro Care Hospital*). 
Once logged in, all data displayed—patients, beds, admissions, and audit logs—is strictly isolated to your assigned hospital.

### Forgot Password
If you forget your password, click **Forgot Password?** on the login page and contact your local hospital administrator or system administrator to reset it.

### Session Expiry
For security compliance, your session automatically expires after **60 minutes** of inactivity. You will be redirected to the login page—simply log in
again to resume your workspace.

---

## 3. User Roles & Access Control

The system implements strict Role-Based Access Control (RBAC) across 6 distinct user roles:

| Role | Scope | Key Capabilities & Access Level |
|---|---|---|
| **Super Admin** | Global (Platform) | Full platform administration, hospital tenant onboarding, global user management, system-wide analytics, cross-tenant audit logs |
| **Admin** | Hospital Tenant | Complete administrative control over assigned hospital, local user management, bed/ward configuration, local audit logs |
| **CMO / Dept Head** | Hospital Tenant | Clinical leadership: register patients, admit/discharge, assign doctors, schedule ward staff, issue digital prescriptions |
| **Doctor** | Hospital Tenant | Direct patient care: view patients, process admissions & discharges, write and deactivate prescriptions, view doctor assignments |
| **Nurse** | Hospital Tenant | Ward management: register patients, admit/discharge, assign doctors, update bed maintenance statuses |
| **Receptionist** | Hospital Tenant | Front desk operations: register and view patient records only |

---

## 4. Dashboard

The Dashboard provides real-time operational metrics customized to your user role:

### Local Hospital Dashboard (Admin, CMO, Doctor, Nurse, Receptionist)

- **Occupancy Rate** — Percentage of hospital beds currently occupied.
- **Active Admissions** — Number of patients currently admitted in wards.
- **Available Beds** — Number of beds ready for new patient admissions.
- **Total Patients** — Total registered patient records in your hospital tenant.
- **Admission Trends** — Bar chart showing daily admissions vs. discharges over the last 7 days.
- **Ward Occupancy** — Visual breakdown of bed utilization per ward.
- **Recent Patient Admissions** — Stream of recent admission and discharge activities with live status badges.

### Global Executive Dashboard (Super Admin Only)

- **Aggregate System Metrics** — System-wide summary of total onboarded hospitals, global active admissions, total platform beds, and registered users across all tenants.
- **Hospital Tenant Directory Summary** — Operational health and status of all registered hospital facilities.

---

## 5. Patient Management

### Registering a New Patient
1. Click **Patients** in the sidebar navigation.
2. Click the **Register Patient** button (top right).
3. Complete the patient demographic details:
   - First Name & Last Name
   - Date of Birth & Gender
   - Blood Group
   - Primary Phone Number
   - Email Address (optional)
   - Residential Address
   - Emergency Contact Name & Phone
4. Click **Register Patient** to save.

**Who can register patients:**
- Super Admin, Admin, CMO, Nurse, Receptionist — **ALLOWED**
- Doctor — **DENIED**

### Searching & Filtering Patients

- **Search Bar:** Search by patient first name or last name in real time.
- **Phone Filter:** Filter records directly by primary contact number.

### Editing Patient Records

1. Locate the patient in the registered list.
2. Click the **Edit (pencil)** icon on the right action column.
3. Update necessary demographic or emergency contact details.
4. Click **Save Changes**.

### Deleting a Patient Record
- Only **Super Admin** and **Admin** roles can delete patient records.
- Click the **Delete (trash)** icon next to the patient and confirm.
- *Note:* Patient records undergo **soft-deletion**—they are removed from UI views but safely retained in the database for compliance and audit auditing.

---

## 6. Bed & Admission Management

### Viewing Wards and Beds
1. Click **Bed & Admissions** in the sidebar.
2. Select any ward tab (e.g., *ICU*, *General Ward*, *Pediatrics*) to view rooms and individual beds.
3. Bed color codes reflect real-time operational status:
   - **Available (Green)** — Cleaned and ready for immediate patient admission.
   - **Occupied (Red)** — Patient currently admitted.
   - **Maintenance (Yellow)** — Bed undergoing cleaning, sterilization, or repair.

### Admitting a Patient

1. Navigate to **Bed & Admissions**.
2. Locate an **Available** bed in the designated ward.
3. Click **Admit** on the bed card.
4. Select the patient from the dropdown (already admitted patients are automatically disabled).
5. Enter the admission reason / clinical summary.
6. Click **Confirm Admission**. Bed status automatically switches to *Occupied*.
7. *Next Step:* Proceed to **Doctor Assignments** to assign attending physicians.

**Who can admit patients:**
- Super Admin, Admin, CMO, Doctor, Nurse — **ALLOWED**
- Receptionist — **DENIED**

### Discharging a Patient

1. Locate the **Occupied** bed card.
2. Click **Discharge**.
3. Review patient admission summary.
4. Select post-discharge bed status (*Admin, CMO, Nurse*):
   - **Maintenance** (Recommended: flags bed for cleaning).
   - **Available** (Immediately ready for next patient).
5. Click **Confirm Discharge**.

*Note:* When a **Doctor** discharges a patient, the system automatically transitions the bed status to **Maintenance** to enforce sanitation protocols.

### Resetting Bed Status After Maintenance

When cleaning or repair is finished (*Admin, CMO, Nurse*):
1. Locate the bed in **Maintenance** status.
2. Click **Set Available** to restore the bed to service.

### Ward, Room, and Bed Configuration (Admin & Super Admin Only)
1. Go to **Bed & Admissions**.
2. Use **Add Ward**, **Add Room**, or **Add Bed** buttons at the top header.
3. Fill in ward codes, room numbers, and bed identifiers.
4. Click **Create**.

---

## 7. Doctor Assignments

### Viewing Assignments

1. Click **Doctor Assignments** in the sidebar.
2. View all active ward admissions along with their primary assigned physicians.

### Assigning an Attending Doctor

1. Find the newly admitted patient record.
2. Click **Add Doctor**.
3. Select an active physician from the dropdown menu.
4. Add clinical handover notes (optional).
5. Click **Assign Doctor**.

### Reassigning Doctors

1. Locate the active patient assignment.
2. Click **Unassign** to detach the current physician.
3. Click **Add Doctor** to select a new attending physician.

**Who can assign/unassign doctors:**

- Super Admin, Admin, CMO, Nurse — **ALLOWED**

- Doctor, Receptionist — **DENIED** (Doctors have view-only access).

---

## 8. Staff Ward Scheduling

### Viewing Staff Schedules

1. Click **Staff Assignments** in the sidebar.
2. Review nurse and clinical staff ward allocations and shift timings.

### Scheduling Staff to Wards (Admin & CMO Only)

1. Click **Assign Staff**.
2. Select the target Ward.
3. Select the active staff member from the dropdown.
4. Define shift start time and end time.
5. Click **Assign Staff**.

### Removing Staff Schedule
1. Locate the staff shift entry.
2. Click the **Delete (trash)** icon and confirm removal.

---

## 9. Digital Prescriptions

### Viewing Prescriptions

1. Click **Prescriptions** in the sidebar.
2. Select an admitted patient from the active roster on the left panel.
3. View active and historical medical prescriptions on the right workspace panel.

### Issuing a New Prescription (Doctor & CMO Only)

1. Select the admitted patient.
2. Click **Add Prescription**.
3. Fill in medication details:
   - **Medicine Name** (e.g., Amoxicillin)
   - **Dosage** (e.g., 500mg)
   - **Frequency** (e.g., Thrice daily after meals)
   - **Duration** (e.g., 7 days)
   - **Special Instructions** (e.g., Complete full course)
4. Click **Add Prescription** to log into the patient's record.

### Deactivating Prescriptions (Doctor & CMO Only)

1. Locate the active prescription in the patient's record.
2. Click **Deactivate**.
3. Confirm deactivation—status changes to *Inactive*, stopping active treatment administration.

---

## 10. Audit Logs

Audit logging maintains an immutable trail of system actions for clinical governance and security monitoring.

1. Click **Audit Logs** in the sidebar.
2. Each log entry records:
   - **Action Type** (e.g., `PATIENT_REGISTERED`, `PATIENT_ADMITTED`, `PATIENT_DISCHARGED`, `USER_DEACTIVATED`)
   - **Target Entity ID & Type**
   - **Performed By** (User ID & Email)
   - **State Delta** (Previous state vs. Updated state)
   - **Timestamp**

**Audit Access Scope:**
- **Local Admin:** Views audit logs generated strictly within their hospital tenant.
- **Super Admin:** Accesses global audit logs across all registered hospital tenants.
- **Doctors, Nurses, Receptionists:** Access restricted.

---

## 11. Analytics Hub

The Analytics Hub provides real-time clinical and capacity analytics:

- **Total Patients & Admissions** — Aggregate historic metrics.
- **Average Length of Stay (ALOS)** — Average inpatient duration in days.
- **Monthly Admission Trends** — 6-month longitudinal line chart (Admissions vs. Discharges).
- **Gender & Blood Group Distribution** — Demographic pie and bar charts.
- **Ward Performance & Occupancy** — Comparative utilization metrics per ward.

*Access:* Available to all authenticated users within their hospital scope.

---

## 12. User Management

### Local User Management (Admin Only)

Hospital Admins manage staff accounts within their hospital tenant:
1. Click **User Management** in the sidebar.
2. View all staff accounts, active roles, and account statuses.
3. Click **Add New User** to onboard new Doctors, Nurses, Receptionists, or CMOs.
4. Edit staff details or toggle **Activate / Deactivate** account status.
   - *Deactivated users are immediately blocked from logging in and removed from assignment dropdowns.*

---

## 13. Hospital Tenant Onboarding (Super Admin Only)

Super Administrators manage platform multi-tenancy via the dedicated **Hospitals** portal:

1. Log in with Super Admin credentials (`superadmin@pabms.com`).
2. Click **Hospitals** in the sidebar navigation (`/hospitals`).
3. View all onboarded hospital facilities across the platform.
4. Click **Create Hospital**:
   - Enter **Hospital Name** (e.g., *Metropolitan Health Center*)
   - Enter Unique **Hospital Code** (e.g., `MHC-01`)
   - Enter Contact Email and Address details.
5. Click **Submit** to instantiate the new tenant.
6. Provision a new local **Admin** account for the onboarded hospital via User Management.

---

## 14. Profile & Account Settings

### Updating Profile Details
1. Click your account profile name in the bottom sidebar.
2. Select **Profile Settings**.
3. Update First Name or Last Name, then click **Save Changes**.

### Changing Your Password

1. In **Profile Settings**, navigate to **Change Password**.
2. Enter your **Current Password**.
3. Enter and confirm your **New Password** (minimum 8 characters).
4. Click **Change Password**.

### Admin Password Reset
Hospital Admins and Super Admins can force-reset passwords for accounts under their administrative scope via 
the **Admin — Reset User Password** tool located within Profile Settings.

---

## 15. Signing Out

To terminate your session securely, click **Sign Out** at the bottom of the left sidebar navigation. 
Always log out when stepping away from your workstation to maintain HIPAA/data privacy compliance.

## 16. Tips

- Always log out when leaving your workstation
- Change your password regularly for security
- Contact your system administrator if you are locked out
- Deactivated users cannot login — contact admin to reactivate
- Doctor assignment should be done immediately after admitting a patient through the Doctor Assignments page