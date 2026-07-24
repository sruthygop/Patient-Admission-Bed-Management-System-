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

The system has three roles with different access levels:

| Role | Description |
|---|---|
| Admin | Full access to all features — register, update, delete patients, manage beds, admit/discharge, assign doctors and staff, view audit logs, reset user passwords |
| Doctor | View-only access to dashboard, patients, beds, admissions, doctor assignments and staff assignments |
| Staff/Nurse | Can register and update patients, admit and discharge patients, assign and unassign doctors — cannot delete patients or view audit logs |

---

## 4. Dashboard

The Dashboard gives a real-time overview of the hospital:

- **Occupancy Rate** — percentage of beds currently occupied
- **Active Admissions** — number of patients currently admitted
- **Available Beds** — number of beds ready for new patients
- **Total Patients** — total registered patients in the system
- **Admission Trends** — line chart showing daily admissions vs discharges for the last 7 days
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
5. Select the assigned doctor
6. Enter the reason for admission
7. Click **Confirm Admission**

### Discharging a Patient
1. Find the **Occupied** bed
2. Click **Discharge** on the bed card
3. Review the patient and admission details
4. Select the post-discharge bed status:
   - **Maintenance** (recommended for cleaning)
   - **Available** (immediately ready)
5. Click **Confirm Discharge**

### Setting a Bed to Available
If a bed is in **Maintenance** and is ready for use:
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

### Assigning a Doctor
1. Find the patient admission
2. Click **Add Doctor**
3. Select the doctor from the dropdown
4. Add notes (optional)
5. Click **Assign Doctor**

### Unassigning a Doctor
1. Find the doctor assignment
2. Click **Unassign**
3. Confirm the action

---

## 8. Staff Assignments

### Viewing Staff Assignments
1. Click **Staff Assignments** in the sidebar
2. All current staff ward assignments are listed

### Assigning Staff to a Ward (Admin only)
1. Click **Assign Staff** button
2. Select the ward
3. Select the staff member
4. Set the shift start and end time
5. Click **Assign Staff**

### Removing a Staff Assignment (Admin only)
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

## 10. Profile Settings

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

## 11. Signing Out

Click **Sign Out** at the bottom of the sidebar to securely log out of the system.

---

## 12. Tips

- Always log out when leaving your workstation
- Change your password regularly for security
- Contact your system administrator if you are locked out
- The dashboard refreshes automatically — use the refresh button for latest data