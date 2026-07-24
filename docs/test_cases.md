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
| TC-005 | Login as Staff | Enter reception@pabms.com and correct password | Dashboard loads with staff role | Dashboard loaded | Pass |
| TC-006 | Session expiry | Wait for session to expire | Redirected to login page with session expired message | Redirected to login | Pass |
| TC-007 | Forgot Password link | Click Forgot Password on login page | Message shown to contact administrator | Message displayed | Pass |

---

## 2. Patient Management Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-008 | Register new patient | Fill all required fields, click Register Patient | Patient appears in list | Patient added successfully | Pass |
| TC-009 | Register patient with missing required fields | Leave First Name empty, click Register Patient | Validation error shown | Error shown | Pass |
| TC-010 | Search patient by name | Type patient name in search bar | Matching patients shown | Correct results shown | Pass |
| TC-011 | Search patient by phone | Type phone number in filter field | Matching patient shown | Correct results shown | Pass |
| TC-012 | Edit patient details | Click edit icon, update address, click Save | Patient details updated | Details updated successfully | Pass |
| TC-013 | Delete patient as Admin | Click delete icon, confirm deletion | Patient removed from list | Patient hidden from list | Pass |
| TC-014 | Delete patient as Staff | Login as staff, check for delete button | Delete button not visible | Button hidden | Pass |
| TC-015 | Delete patient as Doctor | Login as doctor, check for delete button | Delete button not visible | Button hidden | Pass |


---

## 3. Bed Management Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-016 | View ward beds | Click Bed & Admissions, select ICU ward | All beds shown with status | Beds displayed correctly | Pass |
| TC-017 | Add new ward as Admin | Click Add Ward, fill details, click Create Ward | New ward tab appears | Ward created successfully | Pass |
| TC-018 | Add new room as Admin | Click Add Room, select ward, fill details | Room appears in ward | Room created successfully | Pass |
| TC-019 | Add new bed as Admin | Click Add Bed, select ward and room, fill details | Bed appears in room | Bed created successfully | Pass |
| TC-020 | Add ward as Staff | Login as staff, check for Add Ward button | Button not visible | Button hidden | Pass |

---

## 4. Admission Management Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-021 | Admit patient to available bed | Click Admit on available bed, select patient and doctor, enter reason | Patient admitted, bed status changes to Occupied | Admission successful | Pass |
| TC-022 | Admit already admitted patient | Try to admit a patient who is already admitted | Patient shown as Already Admitted in dropdown | Patient disabled in dropdown | Pass |
| TC-023 | Discharge patient | Click Discharge on occupied bed, confirm | Patient discharged, bed status changes | Discharge successful | Pass |
| TC-024 | Set bed to Available after maintenance | Click Set Available on maintenance bed | Bed status changes to Available | Status updated | Pass |
| TC-025 | Admit patient as Doctor | Login as doctor, check for Admit button | Button not visible | Button hidden | Pass |

---

## 5. Doctor Assignment Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-026 | Assign doctor to admission | Click Add Doctor, select doctor, click Assign | Doctor shown as Active in assignment | Assignment successful | Pass |
| TC-027 | Unassign doctor | Click Unassign next to active doctor | Doctor shown as Unassigned | Unassignment successful | Pass |
| TC-028 | View doctor assignments as Doctor | Login as doctor, click Doctor Assignments | Assignments visible but no edit buttons | View only access confirmed | Pass |

---

## 6. Staff Assignment Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-029 | Assign staff to ward as Admin | Click Assign Staff, select ward and staff, set shift | Assignment appears in list | Assignment successful | Pass |
| TC-030 | Remove staff assignment as Admin | Click delete icon on assignment, confirm | Assignment removed from list | Removal successful | Pass |
| TC-031 | Assign staff as Staff/Nurse | Login as staff, check for Assign Staff button | Button not visible | Button hidden | Pass |
| TC-032 | View staff assignments as Doctor | Login as doctor, click Staff Assignments | Assignments visible but no edit buttons | View only access confirmed | Pass |

---

## 7. Dashboard Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-033 | View dashboard stats | Login and go to Dashboard | Correct occupancy rate, active admissions, available beds shown | All stats correct | Pass |
| TC-034 | View admission trends chart | Check admission trends line chart | Chart shows last 7 days data | Chart displayed correctly | Pass |
| TC-035 | View ward occupancy | Check ward occupancy section | Each ward shows correct occupancy percentage | Occupancy correct | Pass |
| TC-036 | View recent admissions | Check recent admissions table | Latest 5 admissions shown with correct status | Table correct | Pass |

---

## 8. Audit Log Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-037 | View audit logs as Admin | Login as admin, click Audit Logs | All system actions shown with details | Logs displayed correctly | Pass |
| TC-038 | View audit logs as Doctor | Login as doctor, check sidebar | Audit Logs not visible in sidebar | Menu item hidden | Pass |
| TC-039 | View audit logs as Staff | Login as staff, check sidebar | Audit Logs not visible in sidebar | Menu item hidden | Pass |
| TC-040 | Audit log after patient registration | Register a patient, check audit logs | PATIENT_REGISTERED entry appears | Log entry created | Pass |
| TC-041 | Audit log after admission | Admit a patient, check audit logs | PATIENT_ADMITTED entry appears | Log entry created | Pass |
| TC-042 | Audit log after discharge | Discharge a patient, check audit logs | PATIENT_DISCHARGED entry appears | Log entry created | Pass |
| TC-043 | Audit log after staff assignment | Assign staff to ward, check audit logs | STAFF_ASSIGNED entry appears | Log entry created | Pass |
| TC-044 | Audit log after staff removal | Remove staff assignment, check audit logs | STAFF_REMOVED entry appears | Log entry created | Pass |

---

## 9. Profile Settings Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-045 | Update own name | Open Profile Settings, change name, click Save Changes | Name updated successfully | Update successful | Pass |
| TC-046 | Change own password | Open Profile Settings, enter current and new password, click Change Password | Password changed successfully | Password updated | Pass |
| TC-047 | Change password with wrong current password | Enter wrong current password | Error message shown | Error displayed | Pass |
| TC-048 | Change password with less than 8 characters | Enter new password with 6 characters | Validation error shown | Error displayed | Pass |
| TC-049 | Admin reset user password | Open Profile Settings as admin, select user, enter new password, click Reset | Password reset successfully | Reset successful | Pass |
| TC-050 | Admin reset password section visibility | Login as doctor or staff, open Profile Settings | Admin reset section not visible | Section hidden | Pass |

---

## 10. Security Tests

| Test # | Test Case | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-051 | Access dashboard without login | Go to /dashboard without logging in | Redirected to login page | Redirected to login | Pass |
| TC-052 | Access audit logs as Staff via URL | Login as staff, go to /audit-logs directly | Access restricted message shown | Access denied | Pass |
| TC-053 | API call without JWT token | Call any API endpoint without token | 401 Unauthorized response | 401 returned | Pass |
| TC-054 | Staff trying to assign staff via API | Login as staff, call POST /staff-assignments | 403 Forbidden response | 403 returned | Pass |
| TC-055 | Doctor trying to delete patient via API | Login as doctor, call DELETE /patients/{id} | 403 Forbidden response | 403 returned | Pass |

---

## Test Summary

| Category | Total Tests | Passed | Failed |
|---|---|---|---|
| Authentication | 7 | 7 | 0 |
| Patient Management | 8 | 8 | 0 |
| Bed Management | 5 | 5 | 0 |
| Admission Management | 5 | 5 | 0 |
| Doctor Assignment | 3 | 3 | 0 |
| Staff Assignment | 4 | 4 | 0 |
| Dashboard | 4 | 4 | 0 |
| Audit Logs | 8 | 8 | 0 |
| Profile Settings | 6 | 6 | 0 |
| Security | 5 | 5 | 0 |
| **Total** | **55** | **55** | **0** |

---

## Notes

- All tests were performed manually using the web UI and Swagger API documentation
- Backend was running on http://localhost:8000
- Frontend was running on http://localhost:5173
- Database: PostgreSQL (project_db)
