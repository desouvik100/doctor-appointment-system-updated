# HealthSync Pro — System Inventory
**Generated:** 2026-06-01 | **Method:** Static code analysis of actual source files

---

## 1. APPLICATIONS

| App | Tech Stack | Purpose |
|-----|-----------|---------|
| `mobile/` | React Native 0.73, Android | Patient-facing mobile app |
| `healthsync-pro/` | React Native 0.73, Android | Doctor/Staff/Admin mobile app |
| `frontend/` | React 18, Tailwind CSS | Web patient dashboard |
| `backend/` | Node.js, Express, MongoDB | REST API server |

---

## 2. BACKEND — API ROUTES (93 route files)

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send-registration-otp` | None | Send OTP for registration |
| POST | `/verify-registration-otp` | None | Verify registration OTP |
| POST | `/register` | None | Patient registration |
| POST | `/login` | None | Patient login |
| POST | `/admin/login` | None | Admin login |
| POST | `/clinic/login` | None | Staff/Receptionist login |
| POST | `/doctor/login` | None | Doctor login |
| POST | `/forgot-password` | None | Password reset request |
| POST | `/reset-password` | None | Password reset confirm |
| POST | `/refresh` | None | Token refresh |
| GET | `/me` | JWT | Get current user |
| POST | `/logout` | JWT | Logout |

### OTP (`/api/otp`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send-otp` | None | Send OTP (email/phone) |
| POST | `/verify-otp` | None | Verify OTP |
| GET | `/check-config` | None | Debug email config |

### Appointments (`/api/appointments`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin | All appointments |
| GET | `/my` | JWT | User's appointments |
| POST | `/` | JWT | Create appointment (slot-based) |
| POST | `/queue-booking` | JWT | Queue-based booking |
| POST | `/slot-booking` | JWT | Strict slot booking |
| GET | `/queue-info/:doctorId/:date` | None | Queue status |
| GET | `/smart-queue/:doctorId/:date` | None | Smart queue analysis |
| GET | `/doctor/:doctorId/queue` | JWT | Doctor's queue |
| GET | `/doctor/:doctorId/today-queue` | JWT | Today's queue |
| PUT | `/:id/status` | Doctor/Staff/Admin | Update status |
| PUT | `/:id/cancel` | JWT | Cancel appointment |
| PUT | `/:id/reschedule` | JWT | Reschedule |
| GET | `/:id/queue-position` | JWT | Queue position |
| POST | `/:id/generate-meeting` | JWT | Generate Meet link |
| GET | `/:id` | JWT | Get appointment |

### Payments (`/api/payments`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create-order` | JWT | Create Razorpay order |
| POST | `/verify` | JWT | Verify payment signature |
| POST | `/verify-by-order` | JWT | Verify by order ID |
| POST | `/refund` | JWT | Process refund |
| GET | `/status/:appointmentId` | JWT | Payment status |
| GET | `/history` | JWT | Payment history |
| GET | `/mobile-checkout/:orderId` | None | WebView checkout page |
| GET | `/razorpay-callback` | None | Payment callback |
| GET | `/razorpay-cancel` | None | Payment cancel |
| POST | `/webhook` | None | Razorpay webhook |

### Doctors (`/api/doctors`)
- CRUD operations, search, availability, schedule management

### Users (`/api/users`)
- Profile management, location, preferences

### Clinics (`/api/clinics`)
- Clinic management, staff, analytics

### Wallet (`/api/wallet` — inferred from walletRoutes.js)
- Balance, top-up, pay, transaction history

### Loyalty (`/api/loyalty`, `/api/loyalty-points`)
- Points balance, transactions, tier management

### Notifications (`/api/notifications`)
- Push notifications, in-app notifications

### EMR (`/api/emr`, `/api/emr-advanced`)
- Electronic Medical Records, prescriptions, vitals

### Lab Reports (`/api/lab-reports`)
- Upload, view, download lab reports

### Prescriptions (`/api/prescriptions`)
- Create, view, download prescriptions

### Analytics (`/api/analytics`, `/api/clinic-analytics`)
- Revenue, appointments, doctor performance

### Queue (`/api/queue`, `/api/advanced-queue`)
- Queue management, token system

### Other Routes (50+)
- Ambulance, AI Health, AI Reports, Articles, Audit Logs
- Billing, Challenges, Chat, Coupons, Drug Interactions
- Emergency SOS, Export, Family, Favorites, Follow-ups
- Google OAuth, Health Checkup, Health Packages, Imaging
- Insurance, Invoices, IPD, Jobs, Location, Medicine Reminders
- Multi-branch, OTP, PDF, Pharmacy, Profile, Referrals
- Refunds, Reminders, Reviews, Schedules, Security
- Slots, Smart Alerts, Staff Management, Subscriptions
- Support, Symptoms, Systematic History, Tokens, Upload
- Vendors, WhatsApp

---

## 3. BACKEND — DATA MODELS (85 models)

### Core Models
- `User` — patients, admins, staff
- `Doctor` — doctor profiles, schedules, settings
- `Clinic` — clinic profiles, settings
- `Appointment` — bookings, queue, payment status
- `Payment` — payment records
- `Prescription` — prescriptions
- `LoyaltyPoints` — points, transactions, tiers

### Medical Records
- `MedicalRecord`, `MedicalHistory`, `MedicalFile`
- `LabReport`, `LabOrder`, `LabResult`, `LabBooking`
- `ImagingReport`, `DicomStudy`
- `EMRVisit`, `ConsultationNote`, `SystematicHistory`

### Queue & Scheduling
- `QueueToken`, `QueuePosition`, `OfflineQueueToken`, `WaitingQueue`
- `DoctorSchedule`, `DoctorLeave`, `OnlineSlot`, `ClinicSlot`

### Financial
- `DoctorWallet`, `FamilyWallet`, `Payout`
- `Invoice`, `ClinicBilling`, `FinancialLedger`
- `CommissionConfig`, `Coupon`, `Subscription`

### Communication
- `Notification`, `StaffNotification`, `ChatMessage`, `Conversation`

### Security & Audit
- `AuditLog`, `EMRAuditLog`, `ImmutableAuditLog`, `SuspiciousActivity`

---

## 4. BACKEND — SERVICES (65 services)

### Critical Services
- `emailService` — OTP, appointment emails, reminders
- `razorpayService` — order creation, payment verification
- `paymentService` — payment processing
- `tokenService` — appointment token generation
- `smartQueueService` — queue position, wait time
- `pushNotificationService` — FCM push notifications
- `smsService` — SMS notifications
- `whatsappService` — WhatsApp notifications
- `googleMeetService` — video consultation links
- `jwtTokenService` — JWT management

### AI Services
- `aiChatbotService`, `aiHealthService`, `aiPredictionService`
- `aiReportAnalyzer`, `aiSecurityService`

### Infrastructure
- `cacheService` — Redis/in-memory cache
- `socketManager` — WebSocket real-time
- `backupService` — database backups
- `errorLoggingService` — error tracking
- `encryptionService` — data encryption

---

## 5. MOBILE APP — SCREENS (user app: `mobile/`)

### Auth (10 screens)
- LoginScreen, RegisterScreen, OTPVerificationScreen
- ForgotPasswordScreen, ResetPasswordScreen
- RoleSelectionScreen, VerifyOTPScreen
- AdminLoginScreen, DoctorLoginScreen, StaffLoginScreen

### Booking Flow (8 screens)
- BookingScreen, SlotSelectionScreen, ConfirmDetailsScreen
- PaymentScreen, RazorpayPaymentScreen, ConfirmationScreen
- NewBookingFlow, index

### Home (1 screen + 3 components)
- HomeScreen + LocationDisplay, QuickActions, UpcomingAppointments

### Appointments (4 screens + 2 components)
- AppointmentsScreen, AppointmentDetailsScreen
- RescheduleScreen, VideoConsultationScreen
- + CancelModal, QueueTracker

### Doctors (3 screens + 2 components)
- DoctorsScreen, DoctorProfileScreen, DoctorSearchScreen
- + DoctorCard, FilterPanel

### Profile (10 screens)
- ProfileScreen, EditProfileScreen, FamilyMembersScreen
- HealthReportsScreen, InsuranceScreen, MedicalTimelineScreen
- NotificationSettingsScreen, PaymentMethodsScreen
- RewardsScreen, WalletScreen

### Records (6 screens)
- MedicalTimelineScreen, PrescriptionViewScreen
- ReportDetailsScreen, UploadReportScreen
- VitalsHistoryScreen, index

### Services (7 screens)
- EmergencyScreen, LabTestsScreen, LabTestConfirmationScreen
- LabTestPaymentScreen, MedicalImagingScreen
- MedicineScreen, RecordsScreen, VideoConsultScreen

### Health (2 screens)
- AIChatbotScreen, SymptomCheckerScreen

### Doctor Screens (14 screens)
- DoctorDashboardScreen, DoctorQueueScreen, DoctorAppointmentsScreen
- DoctorAppointmentDetailScreen, DoctorPatientsScreen
- DoctorPatientDetailScreen, DoctorPrescriptionsScreen
- DoctorCreatePrescriptionScreen, DoctorEMRScreen
- DoctorScheduleScreen, DoctorWalletScreen
- DoctorVideoConsultationScreen, DoctorSupportScreen, index

### Staff Screens (12 screens)
- StaffDashboardScreen, StaffQueueScreen, StaffAppointmentsScreen
- StaffAppointmentDetailScreen, StaffPatientsScreen
- StaffPatientDetailScreen, StaffRegisterPatientScreen
- StaffBookAppointmentScreen, StaffDoctorsScreen
- StaffDoctorFormScreen, StaffEMRScreen, index

### Admin Screens (21 screens)
- AdminDashboardScreen, AdminClinicsScreen, AdminDoctorsScreen
- AdminUsersScreen, AdminAppointmentsScreen, AdminReportsScreen
- AdminStaffScreen, AdminCouponsScreen, AdminWalletScreen
- AdminAuditLogsScreen, AdminSupportTicketsScreen
- AdminApprovalsScreen, AdminAddClinicScreen, AdminAddDoctorScreen
- AdminEditClinicScreen, AdminEditDoctorScreen
- AdminClinicDetailScreen, AdminDoctorDetailScreen
- AdminAppointmentDetailScreen, AdminUserDetailScreen, index

### Other
- SplashScreen, OnboardingScreen, NotificationsScreen

---

## 6. HEALTHSYNC PRO — SCREENS (doctor/admin app)

### Auth
- AdminLoginScreen, DoctorLoginScreen, StaffLoginScreen
- ForgotPasswordScreen, ResetPasswordScreen, VerifyOTPScreen
- ProRoleSelectionScreen

### Doctor
- DoctorDashboardScreen, DoctorQueueScreen, DoctorWalletScreen
- DoctorVideoConsultationScreen

### Admin
- AdminDashboardScreen, AdminApprovalsScreen, AdminReportsScreen

### Staff
- PharmacyInventoryScreen

### Profile (shared)
- ProfileScreen, EditProfileScreen, FamilyMembersScreen
- HealthReportsScreen, InsuranceScreen, MedicalTimelineScreen
- NotificationSettingsScreen, PaymentMethodsScreen, RewardsScreen

---

## 7. DEEP LINKS

| App | Scheme | Purpose |
|-----|--------|---------|
| mobile/ (user) | `healthsync://` | Payment callbacks, notifications |
| healthsync-pro/ | `healthsyncpro://` | Pro app deep links (fixed) |

### Payment Deep Links (backend → user app)
- `healthsync://payment-success` — payment confirmed
- `healthsync://payment-failed` — payment failed/cancelled

---

## 8. PAYMENT FLOW

```
User selects payment method
  → POST /api/payments/create-order (creates Razorpay order)
  → Navigate to RazorpayPaymentScreen (WebView)
  → Backend serves /api/payments/mobile-checkout/:orderId (HTML page)
  → Razorpay checkout.js loads in WebView
  → User pays
  → verifyAndComplete() calls POST /api/payments/verify
  → Backend verifies HMAC signature
  → Appointment status updated to 'confirmed'
  → Deep link: healthsync://payment-success
  → App navigates to BookingConfirmation
```

---

## 9. NOTIFICATION CHANNELS

| Channel | Service | Status |
|---------|---------|--------|
| Email | Nodemailer (Gmail) | Configured |
| SMS | smsService | Configured |
| WhatsApp | whatsappService | Configured |
| Push (FCM) | pushNotificationService | Configured |
| In-app | socketManager (WebSocket) | Configured |

---

## 10. AUTOMATED JOBS (backend/jobs/)

| Job | Schedule | Purpose |
|-----|----------|---------|
| Cleanup | 3:00 AM daily | Remove expired data |
| Deep cleanup | Sunday 4:00 AM | Weekly maintenance |
| 24h reminders | Every hour | Appointment reminders |
| 1h reminders | Every 15 min | Pre-appointment alerts |
| Auto-cancel | Every hour | Cancel expired pending |
| Auto-complete | Every 2 hours | Mark past as completed |
| No-show | Every 30 min | Mark no-shows |
| Queue update | Every 15 min | Update queue positions |
| Daily analytics | Every hour | Appointment analytics |
| Doctor performance | Every 2 hours | Performance metrics |
| Revenue analytics | Every hour | Revenue tracking |
| Patient engagement | Every 3 hours | Engagement metrics |

---

## 11. SECURITY MECHANISMS

| Mechanism | Implementation | Applied To |
|-----------|---------------|------------|
| JWT Auth | `verifyToken` middleware | Most routes |
| Role-based access | `verifyTokenWithRole` | Admin/Doctor/Staff routes |
| Rate limiting | In-memory rate limiter | Defined but NOT applied to auth routes |
| Account suspension | Global middleware in server.js | All /api routes |
| Force logout | `forceLogoutAt` field check | All /api routes |
| Clinic isolation | `verifyClinicAccess` | Clinic-specific routes |
| Input sanitization | `sanitizeInputs` global middleware | All routes |
| Webhook signature | HMAC-SHA256 | Razorpay webhook |
| AI security monitoring | `aiSecurityService` | Login attempts |

---

## 12. EXISTING TEST COVERAGE

| Test File | Type | Domain |
|-----------|------|--------|
| bmiCalculation.test.js | Unit | Health calculators |
| drugInteractionService.test.js | Unit | Drug interactions |
| vitalsService.test.js | Unit | Vitals |
| diagnosisService.test.js | Unit | Diagnosis |
| labOrderService.test.js | Unit | Lab orders |
| medicalHistoryService.test.js | Unit | Medical history |
| clinicalWorkflow.integration.test.js | Integration | Clinical workflow |
| criticalAlertsService.test.js | Unit | Alerts |
| temperatureUtils.test.js | Unit | Temperature conversion |
| 17 property-based tests | Property | Various services |

**Missing:** Auth tests, booking tests, payment tests, queue tests, OTP tests, navigation tests

---

*Generated by static analysis — 2026-06-01*
