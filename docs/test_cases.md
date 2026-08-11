# PABMS Test Cases
## Patient Admission & Bed Management System
### Settlement Sense — 2026

---

## 1. Authentication Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-001 | Login with valid admin credentials | Enter admin@pabms.com and correct password, click Login | Dashboard loads successfully | Dashboard loaded | Pass |
| TC-002 | Login with invalid password | Enter valid email with wrong password, click Login | Error message shown | Error message shown | Pass |
| TC-003 | Login with invalid email | Enter wrong email and password, click Login | Error message shown | Error message shown | Pass |
| TC-004 | Login as Doctor | Enter smith@pabms.com and correct password | Dashboard loads with doctor role | Dashboard loaded | Pass |
| TC-005 | Login as Nurse | Enter mary@pabms.com and correct password | Dashboard loads with nurse role | Dashboard loaded | Pass |
| TC-006 | Login as Receptionist | Enter reception@pabms.com and correct password | Dashboard loads with receptionist role | Dashboard loaded | Pass |
| TC-007 | Login as CMO | Enter cmo@pabms.com and correct password | Dashboard loads with CMO role | Dashboard loaded | Pass |
| TC-008 | Session expiry | Wait for session to expire | Redirected to login page | Redirected to login | Pass |
| TC-009 | Forgot Password link | Click Forgot Password on login page | Message shown to contact administrator | Message displayed | Pass |

---

## 2. Patient Management Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-010 | Register new patient as Admin | Fill all required fields, click Register Patient | Patient appears in list | Patient added successfully | Pass |
| TC-011 | Register new patient as Nurse | Login as nurse, fill all required fields, click Register Patient | Patient appears in list | Patient added successfully | Pass |
| TC-012 | Register new patient as Receptionist | Login as receptionist, fill all required fields, click Register Patient | Patient appears in list | Patient added successfully | Pass |
| TC-013 | Register patient with missing required fields | Leave First Name empty, click Register Patient | Validation error shown | Error shown | Pass |
| TC-014 | Search patient by name | Type patient name in search bar | Matching patients shown | Correct results shown | Pass |
| TC-015 | Search patient by phone | Type phone number in filter field | Matching patient shown | Correct results shown | Pass |
| TC-016 | Edit patient details | Click edit icon, update address, click Save | Patient details updated | Details updated successfully | Pass |
| TC-017 | Delete patient as Admin | Click delete icon, confirm deletion | Patient removed from list | Patient hidden from list | Pass |
| TC-018 | Delete patient as Doctor | Login as doctor, check for delete button | Delete button not visible | Button hidden | Pass |
| TC-019 | Register patient button hidden for Doctor | Login as doctor, check patients page | Register Patient button not visible | Button hidden | Pass |

---

## 3. Bed Management Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-020 | View ward beds | Click Bed & Admissions, select ICU ward | All beds shown with status | Beds displayed correctly | Pass |
| TC-021 | Add new ward as Admin | Click Add Ward, fill details, click Create Ward | New ward tab appears | Ward created successfully | Pass |
| TC-022 | Add new room as Admin | Click Add Room, select ward, fill details | Room appears in ward | Room created successfully | Pass |
| TC-023 | Add new bed as Admin | Click Add Bed, select ward and room, fill details | Bed appears in room | Bed created successfully | Pass |
| TC-024 | Add ward as Nurse | Login as nurse, check for Add Ward button | Button not visible | Button hidden | Pass |
| TC-025 | Add ward as Receptionist | Login as receptionist, check for Add Ward button | Button not visible | Button hidden | Pass |

---

## 4. Admission Management Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-026 | Admit patient as Admin | Click Admit on available bed, select patient, enter reason | Patient admitted, bed status changes to Occupied | Admission successful | Pass |
| TC-027 | Admit patient as Nurse | Login as nurse, click Admit, select patient, enter reason | Patient admitted successfully | Admission successful | Pass |
| TC-028 | Admit patient as Doctor | Login as doctor, click Admit, select patient, enter reason | Patient admitted successfully | Admission successful | Pass |
| TC-029 | Admit already admitted patient | Try to admit a patient who is already admitted | Patient shown as Already Admitted in dropdown | Patient disabled in dropdown | Pass |
| TC-030 | Discharge patient as Admin | Click Discharge on occupied bed, select bed status, confirm | Patient discharged, bed status changes | Discharge successful | Pass |
| TC-031 | Discharge patient as Doctor | Login as doctor, click Discharge, confirm | Patient discharged, bed automatically set to Maintenance | Discharge successful | Pass |
| TC-032 | Set bed to Available after maintenance | Click Set Available on maintenance bed | Bed status changes to Available | Status updated | Pass |
| TC-033 | Admit patient as Receptionist | Login as receptionist, check for Admit button | Button not visible | Button hidden | Pass |

---

## 5. Doctor Assignment Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-034 | Assign doctor to admission as Admin | Click Add Doctor, select doctor, click Assign | Doctor shown as Active in assignment | Assignment successful | Pass |
| TC-035 | Assign doctor to admission as Nurse | Login as nurse, click Add Doctor, select doctor | Doctor assigned successfully | Assignment successful | Pass |
| TC-036 | Unassign doctor as Admin | Click Unassign next to active doctor | Doctor shown as Unassigned | Unassignment successful | Pass |
| TC-037 | View doctor assignments as Doctor | Login as doctor, click Doctor Assignments | Assignments visible but no Add Doctor button | View only access confirmed | Pass |
| TC-038 | View doctor assignments as Receptionist | Login as receptionist, click Doctor Assignments | Assignments visible but no Add Doctor button | View only access confirmed | Pass |
| TC-039 | Deactivated doctor not in dropdown | Deactivate a doctor, try to assign doctor | Deactivated doctor not in dropdown | Doctor hidden from list | Pass |

---

## 6. Staff Assignment Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-040 | Assign staff to ward as Admin | Click Assign Staff, select ward and staff, set shift | Assignment appears in list | Assignment successful | Pass |
| TC-041 | Assign staff to ward as CMO | Login as CMO, click Assign Staff, select ward and staff | Assignment successful | Assignment successful | Pass |
| TC-042 | Remove staff assignment as Admin | Click delete icon on assignment, confirm | Assignment removed from list | Removal successful | Pass |
| TC-043 | Assign staff as Nurse | Login as nurse, check for Assign Staff button | Button not visible | Button hidden | Pass |
| TC-044 | View staff assignments as Doctor | Login as doctor, click Staff Assignments | Assignments visible but no edit buttons | View only access confirmed | Pass |
| TC-045 | Deactivated nurse not in staff dropdown | Deactivate a nurse, try to assign staff | Deactivated nurse not in dropdown | Nurse hidden from list | Pass |

---

## 7. Dashboard Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-046 | View dashboard stats | Login and go to Dashboard | Correct occupancy rate, active admissions, available beds shown | All stats correct | Pass |
| TC-047 | View admission trends chart | Check admission trends bar chart | Chart shows last 7 days data | Chart displayed correctly | Pass |
| TC-048 | View ward occupancy | Check ward occupancy section | Each ward shows correct occupancy percentage | Occupancy correct | Pass |
| TC-049 | View recent admissions | Check recent admissions table | Latest admissions shown with correct status | Table correct | Pass |
| TC-050 | Discharged patient shows in recent admissions | Discharge a patient, check dashboard | Discharged patient appears with red Discharged badge and discharge date | Displayed correctly | Pass |

---

## 8. Audit Log Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-051 | View audit logs as Admin | Login as admin, click Audit Logs | All system actions shown with details | Logs displayed correctly | Pass |
| TC-052 | View audit logs as Doctor | Login as doctor, check sidebar | Audit Logs not visible in sidebar | Menu item hidden | Pass |
| TC-053 | View audit logs as Nurse | Login as nurse, check sidebar | Audit Logs not visible in sidebar | Menu item hidden | Pass |
| TC-054 | View audit logs as Receptionist | Login as receptionist, check sidebar | Audit Logs not visible in sidebar | Menu item hidden | Pass |
| TC-055 | View audit logs as CMO | Login as CMO, check sidebar | Audit Logs not visible in sidebar | Menu item hidden | Pass |
| TC-056 | Audit log after patient registration | Register a patient, check audit logs | PATIENT_REGISTERED entry appears | Log entry created | Pass |
| TC-057 | Audit log after admission | Admit a patient, check audit logs | PATIENT_ADMITTED entry appears | Log entry created | Pass |
| TC-058 | Audit log after discharge | Discharge a patient, check audit logs | PATIENT_DISCHARGED entry appears | Log entry created | Pass |

---

## 9. Profile Settings Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-059 | Update own name | Open Profile Settings, change name, click Save Changes | Name updated successfully | Update successful | Pass |
| TC-060 | Change own password | Open Profile Settings, enter current and new password, click Change Password | Password changed successfully | Password updated | Pass |
| TC-061 | Change password with wrong current password | Enter wrong current password | Error message shown | Error displayed | Pass |
| TC-062 | Change password with less than 8 characters | Enter new password with 6 characters | Validation error shown | Error displayed | Pass |
| TC-063 | Admin reset user password | Open Profile Settings as admin, select user, enter new password, click Reset | Password reset successfully | Reset successful | Pass |
| TC-064 | Admin reset password section hidden for others | Login as doctor or nurse, open Profile Settings | Admin reset section not visible | Section hidden | Pass |

---

## 10. Prescriptions Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-065 | View prescriptions as any role | Click Prescriptions in sidebar | Active patients list shown | Patients displayed | Pass |
| TC-066 | Add prescription as Doctor | Login as doctor, select patient, click Add Prescription, fill details | Prescription added successfully | Prescription created | Pass |
| TC-067 | Add prescription as CMO | Login as CMO, select patient, click Add Prescription, fill details | Prescription added successfully | Prescription created | Pass |
| TC-068 | Add Prescription button hidden for Nurse | Login as nurse, go to Prescriptions page | Add Prescription button not visible | Button hidden | Pass |
| TC-069 | Add Prescription button hidden for Receptionist | Login as receptionist, go to Prescriptions page | Add Prescription button not visible | Button hidden | Pass |
| TC-070 | Deactivate prescription as Doctor | Click Deactivate on active prescription | Prescription status changes to Inactive | Deactivated successfully | Pass |

---

## 11. Analytics Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-071 | View analytics as Admin | Click Analytics in sidebar | All charts and stats shown | Analytics loaded | Pass |
| TC-072 | View analytics as Doctor | Login as doctor, click Analytics | All charts and stats shown | Analytics loaded | Pass |
| TC-073 | View analytics as Nurse | Login as nurse, click Analytics | All charts and stats shown | Analytics loaded | Pass |
| TC-074 | Monthly trends chart | Check monthly admission trends | Line chart shows last 6 months data | Chart displayed correctly | Pass |
| TC-075 | Gender distribution chart | Check gender distribution | Pie chart shows correct gender breakdown | Chart correct | Pass |

---

## 12. User Management Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-076 | View all users as Admin | Click User Management in sidebar | All users listed with roles and status | Users displayed | Pass |
| TC-077 | Add new doctor | Click Add New User, fill details, select Doctor role | New doctor appears in list and can login | User created successfully | Pass |
| TC-078 | Add new nurse | Click Add New User, fill details, select Nurse role | New nurse appears in list and can login | User created successfully | Pass |
| TC-079 | Edit user details | Click edit icon, update name or role, click Save | User details updated | Update successful | Pass |
| TC-080 | Deactivate user | Click Deactivate on active user | User status changes to Inactive | Deactivated successfully | Pass |
| TC-081 | Activate user | Click Activate on inactive user | User status changes to Active | Activated successfully | Pass |
| TC-082 | Deactivated user cannot login | Deactivate a user, try to login with their credentials | Login fails with error message | Login denied | Pass |
| TC-083 | User Management hidden for non-admin | Login as doctor or nurse, check sidebar | User Management not visible in sidebar | Menu item hidden | Pass |

---

## 13. Security Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-084 | Access dashboard without login | Go to /dashboard without logging in | Redirected to login page | Redirected to login | Pass |
| TC-085 | Access audit logs as Nurse via URL | Login as nurse, go to /audit-logs directly | Access restricted message shown | Access denied | Pass |
| TC-086 | API call without JWT token | Call any API endpoint without token | 401 Unauthorized response | 401 returned | Pass |
| TC-087 | Nurse trying to assign staff via API | Login as nurse, call POST /staff-assignments | 403 Forbidden response | 403 returned | Pass |
| TC-088 | Doctor trying to delete patient via API | Login as doctor, call DELETE /patients/{id} | 403 Forbidden response | 403 returned | Pass |
| TC-089 | Receptionist trying to admit patient via API | Login as receptionist, call POST /admissions | 403 Forbidden response | 403 returned | Pass |

---

## Test Summary

| Category | Total Tests | Passed | Failed |
|---|---|---|---|
| Authentication | 9 | 9 | 0 |
| Patient Management | 10 | 10 | 0 |
| Bed Management | 6 | 6 | 0 |
| Admission Management | 8 | 8 | 0 |
| Doctor Assignment | 6 | 6 | 0 |
| Staff Assignment | 6 | 6 | 0 |
| Dashboard | 5 | 5 | 0 |
| Audit Logs | 8 | 8 | 0 |
| Profile Settings | 6 | 6 | 0 |
| Prescriptions | 6 | 6 | 0 |
| Analytics | 5 | 5 | 0 |
| User Management | 8 | 8 | 0 |
| Security | 6 | 6 | 0 |
| **Total** | **89** | **89** | **0** |

---

## Notes

- All tests were performed manually using the web UI and Swagger API documentation
- Backend was running on http://localhost:8000
- Frontend was running on http://localhost:5173
- Database: PostgreSQL (project_db)
- Testing performed by: Sruthy, Software Engineering Intern, Settlement Sense — 2026