# Mobile App - API Parity Map

## Overview
This document maps all backend APIs to mobile app features for Doctor, Staff, and Admin roles.

---

## 🔐 AUTHENTICATION APIs

| Endpoint | Method | Role | Mobile Status | Notes |
|----------|--------|------|---------------|-------|
| `/api/auth/login` | POST | Patient | ✅ Implemented | Patient login only |
| `/api/auth/doctor/login` | POST | Doctor | ✅ Implemented | Doctor login |
| `/api/auth/clinic/login` | POST | Staff | ✅ Implemented | Receptionist/Staff login |
| `/api/auth/admin/login` | POST | Admin | ✅ Implemented | Admin login |
| `/api/auth/register` | POST | Patient | ✅ Implemented | Patient registration |
| `/api/auth/send-otp` | POST | All | ✅ Implemented | OTP for verification |
| `/api/auth/verify-otp` | POST | All | ✅ Implemented | OTP verification |
| `/api/auth/forgot-password` | POST | All | ✅ Implemented | Password reset request |
| `/api/auth/reset-password` | POST | All | ✅ Implemented | Password reset |
| `/api/auth/google` | POST | Patient | ✅ Implemented | Google OAuth |
| `/api/auth/logout` | POST | All | ✅ Implemented | Logout |
| `/api/auth/refresh` | POST | All | ✅ Implemented | Token refresh |

---

## 👨‍⚕️ DOCTOR APIs

### Dashboard & Stats
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/doctors/summary` | GET | Doctor statistics | ❌ Not connected |
| `/api/doctors/:id` | GET | Get doctor profile | ❌ Not connected |
| `/api/doctors/:id/schedule` | GET | Get weekly schedule | ❌ Not connected |
| `/api/doctors/:id/calendar` | GET | Get calendar view | ❌ Not connected |
| `/api/doctors/:id/available-slots` | GET | Get available slots | ❌ Not connected |

### Appointments (Doctor View)
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/appointments/doctor/:doctorId` | GET | Doctor's appointments | ❌ Not connected |
| `/api/appointments/doctor/:doctorId/today` | GET | Today's appointments | ❌ Not connected |
| `/api/appointments/:id` | GET | Appointment details | ❌ Not connected |
| `/api/appointments/:id/status` | PUT | Update status | ❌ Not connected |
| `/api/appointments/:id/complete` | PUT | Mark complete | ❌ Not connected |

### Patients (Doctor View)
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/doctors/:id/patients` | GET | Doctor's patients | ❌ Not connected |
| `/api/users/:id` | GET | Patient details | ❌ Not connected |
| `/api/health/:patientId/records` | GET | Patient health records | ❌ Not connected |
| `/api/health/:patientId/vitals` | GET | Patient vitals | ❌ Not connected |

### Prescriptions
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/prescriptions` | POST | Create prescription | ❌ Not connected |
| `/api/prescriptions/doctor/:doctorId` | GET | Doctor's prescriptions | ❌ Not connected |
| `/api/prescriptions/:id` | GET | Prescription details | ❌ Not connected |
| `/api/prescriptions/:id` | PUT | Update prescription | ❌ Not connected |

### Consultation Notes
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/consultation-notes` | POST | Create notes | ❌ Not connected |
| `/api/consultation-notes/appointment/:id` | GET | Get notes | ❌ Not connected |

### Schedule Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/doctors/:id/schedule` | PUT | Update schedule | ❌ Not connected |
| `/api/doctors/:id/special-dates` | POST | Add leave/holiday | ❌ Not connected |
| `/api/doctors/:id/special-dates/:dateId` | DELETE | Remove special date | ❌ Not connected |
| `/api/doctor-leaves` | POST | Apply for leave | ❌ Not connected |

### Online Status
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/doctors/:id/heartbeat` | POST | Update online status | ❌ Not connected |
| `/api/doctors/online-status` | GET | Get online status | ❌ Not connected |

---

## 👩‍💼 STAFF/RECEPTIONIST APIs

### Dashboard
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/clinic-analytics/:clinicId/dashboard` | GET | Clinic dashboard stats | ❌ Not connected |

### Appointments Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/receptionist/appointments/:clinicId` | GET | Clinic appointments | ❌ Not connected |
| `/api/appointments` | POST | Book appointment | ❌ Not connected |
| `/api/appointments/:id/status` | PUT | Update status | ❌ Not connected |
| `/api/appointments/:id/cancel` | PUT | Cancel appointment | ❌ Not connected |
| `/api/appointments/:id/reschedule` | PUT | Reschedule | ❌ Not connected |

### Patient Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/receptionist/patients/:clinicId` | GET | Clinic patients | ❌ Not connected |
| `/api/users` | POST | Register patient | ❌ Not connected |
| `/api/users/search` | GET | Search patients | ❌ Not connected |

### Queue Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/queue/:clinicId` | GET | Get queue | ❌ Not connected |
| `/api/queue/check-in` | POST | Check-in patient | ❌ Not connected |
| `/api/queue/:id/call` | PUT | Call patient | ❌ Not connected |
| `/api/queue/:id/complete` | PUT | Complete visit | ❌ Not connected |
| `/api/tokens/generate` | POST | Generate token | ❌ Not connected |

### Doctor Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/receptionist/doctors/:clinicId` | GET | Clinic doctors | ❌ Not connected |
| `/api/receptionist/doctors/:doctorId/availability` | PUT | Update availability | ❌ Not connected |

---

## 🛡️ ADMIN APIs

### Dashboard & Overview
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/analytics/overview` | GET | System overview | ❌ Not connected |
| `/api/analytics/users` | GET | User statistics | ❌ Not connected |
| `/api/analytics/appointments` | GET | Appointment stats | ❌ Not connected |
| `/api/analytics/revenue` | GET | Revenue stats | ❌ Not connected |

### User Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/users` | GET | List all users | ❌ Not connected |
| `/api/users/:id` | GET | User details | ❌ Not connected |
| `/api/users/:id` | PUT | Update user | ❌ Not connected |
| `/api/users/:id/suspend` | PUT | Suspend user | ❌ Not connected |
| `/api/users/:id/activate` | PUT | Activate user | ❌ Not connected |

### Doctor Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/doctors` | GET | List all doctors | ❌ Not connected |
| `/api/doctors/admin/pending` | GET | Pending approvals | ❌ Not connected |
| `/api/doctors/:id/approve` | PUT | Approve doctor | ❌ Not connected |
| `/api/doctors/:id/reject` | PUT | Reject doctor | ❌ Not connected |
| `/api/doctors/:id` | PUT | Update doctor | ❌ Not connected |
| `/api/doctors/:id` | DELETE | Deactivate doctor | ❌ Not connected |

### Staff Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/receptionist/pending` | GET | Pending staff | ❌ Not connected |
| `/api/receptionist/:id/approve` | PUT | Approve staff | ❌ Not connected |
| `/api/receptionist/:id/reject` | PUT | Reject staff | ❌ Not connected |
| `/api/receptionist/:id/assign-doctor` | PUT | Assign to doctor | ❌ Not connected |

### Clinic Management
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/clinics` | GET | List clinics | ❌ Not connected |
| `/api/clinics` | POST | Create clinic | ❌ Not connected |
| `/api/clinics/:id` | PUT | Update clinic | ❌ Not connected |
| `/api/clinics/:id` | DELETE | Deactivate clinic | ❌ Not connected |
| `/api/clinics/admin/pending` | GET | Pending clinics | ❌ Not connected |
| `/api/clinics/:id/approve` | PUT | Approve clinic | ❌ Not connected |

### Reports & Audit
| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/audit-logs` | GET | Audit logs | ❌ Not connected |
| `/api/reports/generate` | POST | Generate report | ❌ Not connected |

---

## 📱 PATIENT APIs (Already Implemented)

| Endpoint | Method | Description | Mobile Status |
|----------|--------|-------------|---------------|
| `/api/doctors` | GET | Search doctors | ✅ Implemented |
| `/api/appointments` | GET | My appointments | ✅ Implemented |
| `/api/appointments` | POST | Book appointment | ✅ Implemented |
| `/api/wallet/balance` | GET | Wallet balance | ✅ Implemented |
| `/api/health/records` | GET | Health records | ✅ Implemented |
| `/api/prescriptions/patient/:id` | GET | My prescriptions | ✅ Implemented |
| `/api/family` | GET | Family members | ✅ Implemented |

---

## 🔧 IMPLEMENTATION PRIORITY

### Phase 1: Doctor Dashboard (HIGH PRIORITY)
1. `/api/appointments/doctor/:doctorId/today` - Today's appointments
2. `/api/appointments/doctor/:doctorId` - All appointments
3. `/api/doctors/:id` - Doctor profile
4. `/api/prescriptions` - Create prescription
5. `/api/consultation-notes` - Consultation notes

### Phase 2: Staff Dashboard (HIGH PRIORITY)
1. `/api/receptionist/appointments/:clinicId` - Clinic appointments
2. `/api/queue/:clinicId` - Queue management
3. `/api/receptionist/patients/:clinicId` - Patient list
4. `/api/appointments` - Book appointment
5. `/api/tokens/generate` - Token generation

### Phase 3: Admin Dashboard (MEDIUM PRIORITY)
1. `/api/analytics/overview` - Dashboard stats
2. `/api/doctors/admin/pending` - Pending approvals
3. `/api/users` - User management
4. `/api/clinics` - Clinic management

---

## 📁 MOBILE API SERVICE STRUCTURE

```
mobile/src/services/api/
├── apiClient.js          ✅ EXISTS - Base axios client
├── authService.js        ✅ EXISTS - Authentication
├── appointmentService.js ✅ EXISTS - Patient appointments
├── doctorService.js      ✅ EXISTS - Doctor search (patient view)
├── doctorDashboardApi.js ❌ NEEDED - Doctor dashboard APIs
├── staffDashboardApi.js  ❌ NEEDED - Staff dashboard APIs
├── adminDashboardApi.js  ❌ NEEDED - Admin dashboard APIs
├── prescriptionApi.js    ❌ NEEDED - Prescription management
├── queueApi.js           ❌ NEEDED - Queue management
└── analyticsApi.js       ❌ NEEDED - Analytics/reports
```

---

## ✅ NEXT STEPS

1. Create `doctorDashboardApi.js` with all doctor-specific endpoints
2. Create `staffDashboardApi.js` with all staff-specific endpoints  
3. Create `adminDashboardApi.js` with all admin-specific endpoints
4. Connect Doctor Dashboard screens to real APIs
5. Connect Staff Dashboard screens to real APIs
6. Connect Admin Dashboard screens to real APIs
7. Add proper error handling and loading states
8. Test all flows end-to-end
