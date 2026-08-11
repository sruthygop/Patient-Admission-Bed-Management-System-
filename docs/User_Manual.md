# PABMS User Manual
## Patient Admission & Bed Management System
### Settlement Sense — 2026

---

## 1. Introduction

The Patient Admission & Bed Management System (PABMS) is a web-based hospital management system developed for Settlement Sense. It enables hospital staff to manage patient registrations, bed allocations, admissions, discharges, doctor assignments, and staff scheduling through a simple and professional interface.

---

## 2. Accessing the System

### Login
1. Open your browser and go to the system URL
2. Enter your **Email Address** (e.g. `admin@pabms.com`)
3. Enter your **Password**
4. Click **Login**

### Forgot Password
If you forget your password, click **Forgot Password?** on the login page and contact your system administrator to reset it.

### Session Expiry
Your session will automatically expire after 60 minutes of inactivity. You will be redirected to the login page — simply log in again to continue.

---

## 3. User Roles

The system has 5 roles with different access levels:

| Role | Description |
|---|---|
| Admin | Full access to all features including user management and audit logs |
| CMO / Department Head | Can register patients, admit/discharge, bed status upadte assign doctors, schedule staff, write prescriptions |
| Doctor | Can view patients, admit and discharge patients, write and manage prescriptions |
| Nurse | Can register patients, admit/discharge patients, assign doctors,update bed status |
| Receptionist | Can register and view patients only |

---

## 4. Dashboard

The Dashboard gives a real-time overview of the hospital:

- **Occupancy Rate** — percentage of beds currently occupied
- **Active Admissions** — number of patients currently admitted
- **Available Beds** — number of beds ready for new patients
- **Total Patients** — total registered patients in the system
- **Admission Trends** — bar chart showing daily admissions vs discharges for the last 7 days
- **Ward Occupancy** — breakdown of bed usage per ward
- **Recent Patient Admissions** — latest admitted and discharged patients

---

## 5. Patient Management

### Registering a New Patient
1. Click **Patients** in the sidebar
2. Click **Register Patient** button (top right)
3. Fill in the patient details:
   - First Name and Last Name
   - Date of Birth
   - Gender
   - Blood Group
   - Phone Number
   - Email Address (optional)
   - Residential Address
   - Emergency Contact Name and Phone
4. Click **Register Patient** to save

### Who can register patients:
- Admin, CMO, Nurse, Receptionist — ALLOW
- Doctor — DENY

### Searching for a Patient
- Use the **Search** bar to search by first or last name
- Use the **Filter by phone** field to search by phone number

### Editing a Patient
1. Find the patient in the list
2. Click the **edit (pencil) icon** on the right
3. Update the required fields
4. Click **Save Changes**

### Deleting a Patient
- Only **Admin** can delete patients
- Click the **delete (trash) icon** next to the patient
- Confirm the deletion
- Note: Patient records are soft-deleted — they remain in the database but are hidden from the list

---

## 6. Bed and Admission Management

### Viewing Wards and Beds
1. Click **Bed & Admissions** in the sidebar
2. Click on any ward tab to view its rooms and beds
3. Each bed shows its current status:
   - **Available** — ready for a new patient
   - **Occupied** — patient currently admitted
   - **Maintenance** — bed is being cleaned or repaired

### Admitting a Patient
1. Go to **Bed & Admissions**
2. Find an **Available** bed
3. Click **Admit** on the bed card
4. Select the patient from the dropdown
5. Enter the reason for admission
6. Click **Confirm Admission**
7. After admission, go to **Doctor Assignments** page to assign a doctor

### Who can admit patients:
- Admin, CMO, Doctor, Nurse — ALLOW
- Receptionist — DENY

### Discharging a Patient
1. Find the **Occupied** bed
2. Click **Discharge** on the bed card
3. Review the patient and admission details
4. Select the post-discharge bed status (Admin, CMO, Nurse only):
   - **Maintenance** (recommended for cleaning)
   - **Available** (immediately ready)
5. Click **Confirm Discharge**

Note: When a Doctor discharges a patient, bed is automatically set to Maintenance.

### Setting a Bed to Available
If a bed is in **Maintenance** and is ready for use (Admin, CMO, Nurse only):
1. Find the bed
2. Click **Set Available**

### Adding Wards, Rooms, and Beds (Admin only)
1. Go to **Bed & Admissions**
2. Click **Add Ward**, **Add Room**, or **Add Bed** buttons at the top
3. Fill in the required details
4. Click the create button

---

## 7. Doctor Assignments

### Viewing Doctor Assignments
1. Click **Doctor Assignments** in the sidebar
2. All active admissions are listed with their assigned doctors

### Assigning a Doctor (After Admission)
1. Find the newly admitted patient
2. Click **Add Doctor**
3. Select the doctor from the dropdown
4. Add notes (optional)
5. Click **Assign Doctor**

### Reassigning a Doctor (When doctor is busy or on leave)
1. Find the current doctor assignment
2. Click **Unassign** to remove current doctor
3. Click **Add Doctor** to assign a new doctor

### Who can assign doctors:
- Admin, CMO, Nurse — ALLOW
- Doctor, Receptionist — DENY

---

## 8. Staff Assignments

### Viewing Staff Assignments
1. Click **Staff Assignments** in the sidebar
2. All current staff ward assignments are listed

### Assigning Staff to a Ward (Admin and CMO only)
1. Click **Assign Staff** button
2. Select the ward
3. Select the staff member
4. Set the shift start and end time
5. Click **Assign Staff**

### Removing a Staff Assignment (Admin and CMO only)
1. Find the assignment in the list
2. Click the **delete (trash) icon**
3. Confirm the removal

---

## 9. Audit Logs (Admin only)

1. Click **Audit Logs** in the sidebar
2. View the complete history of all system actions
3. Each log entry shows:
   - Action performed (e.g. PATIENT_ADMITTED, PATIENT_DELETED)
   - Entity affected
   - Who performed the action
   - Old and new values
   - Timestamp

---

## 10. Analytics Hub

The Analytics Hub provides detailed clinical and operational insights:

- **Total Patients** — total registered patients in the system
- **Total Admissions** — all time admission count
- **Total Discharged** — successfully discharged patients
- **Average Length of Stay** — average days patients stay
- **Monthly Admission Trends** — line chart showing admissions vs discharges over last 6 months
- **Gender Distribution** — pie chart showing patient gender breakdown
- **Blood Group Distribution** — bar chart showing patient blood group breakdown
- **Ward Performance** — occupancy rate comparison across all wards

All roles can access the Analytics Hub.

---

## 11. Digital Prescriptions

### Viewing Prescriptions
1. Click **Prescriptions** in the sidebar
2. Select a patient from the active patients list on the left
3. View all prescriptions for that patient on the right

### Writing a Prescription (Doctor and CMO only)
1. Select the admitted patient from the left panel
2. Click **Add Prescription** button
3. Fill in the prescription details:
   - Medicine Name (e.g. Paracetamol)
   - Dosage (e.g. 500mg)
   - Frequency (e.g. Twice daily)
   - Duration (e.g. 5 days)
   - Instructions (e.g. Take after food)
4. Click **Add Prescription** to save

### Deactivating a Prescription (Doctor and CMO only)
1. Find the prescription in the list
2. Click **Deactivate** next to the active prescription
3. Confirm the action — prescription status changes to Inactive

---

## 12. User Management (Admin only)

### Viewing All Users
1. Click **User Management** in the sidebar
2. All system users are listed with their role and status

### Adding a New User
1. Click **Add New User** button
2. Fill in the user details:
   - First Name and Last Name
   - Username (unique)
   - Email Address (unique)
   - Password (minimum 8 characters)
   - Role (Doctor, Nurse, Receptionist, CMO, or Admin)
3. Click **Create User** — the new user can login immediately

### Editing a User
1. Find the user in the list
2. Click the **edit (pencil) icon**
3. Update First Name, Last Name, or Role
4. Click **Save Changes**

### Activating or Deactivating a User
1. Find the user in the list
2. Click **Deactivate** to disable their account
3. Click **Activate** to re-enable their account
4. Deactivated users cannot login and will not appear in any dropdowns

---

## 13. Profile Settings

### Updating Your Name
1. Click your name in the sidebar
2. Click **Profile Settings**
3. Update your First Name and Last Name
4. Click **Save Changes**

### Changing Your Password
1. Click your name in the sidebar
2. Click **Profile Settings**
3. Scroll to **Change Password** section
4. Enter your current password
5. Enter and confirm your new password (minimum 8 characters)
6. Click **Change Password**

### Admin — Reset Another User's Password
1. Open **Profile Settings** (as admin)
2. Scroll to **Admin — Reset User Password** section
3. Select the user from the dropdown
4. Enter the new password
5. Click **Reset Password**

---

## 14. Signing Out

Click **Sign Out** at the bottom of the sidebar to securely log out of the system.

---

## 15. Tips

- Always log out when leaving your workstation
- Change your password regularly for security
- Contact your system administrator if you are locked out
- The dashboard auto-refreshes — use the refresh button for latest data
- Deactivated users cannot login — contact admin to reactivate
- Doctor assignment should be done immediately after admitting a patient through the Doctor Assignments page