# Implementation Plan

- [x] 1. Set up EMR subscription data models


  - [x] 1.1 Create EMRSubscription MongoDB model


    - Define schema with clinicId, plan, duration, dates, status
    - Add indexes for clinicId and expiryDate
    - Include payment details subdocument
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Create EMR screen configuration


    - Define EMR_SCREENS constant with plan levels and roles
    - Define SUBSCRIPTION_PLANS with pricing
    - Create plan hierarchy helper functions
    - _Requirements: 2.3, 3.1-3.5, 4.1-4.5, 5.1-5.6_
  - [ ]* 1.3 Write property test for plan hierarchy
    - **Property 2: Plan Hierarchy Inclusion**
    - **Validates: Requirements 3.1, 4.1, 5.1**

- [x] 2. Implement EMR access control middleware
  - [x] 2.1 Create checkEMRAccess middleware
    - Verify clinic has active subscription
    - Check screen permission against plan
    - Return locked status for unauthorized screens
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Create checkEMRRole middleware
    - Verify user role matches screen requirements
    - Filter available screens by role
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 2.3 Write property test for access control
    - **Property 1: Subscription Access Control**
    - **Validates: Requirements 2.1, 2.2**
  - [ ]* 2.4 Write property test for role-screen restriction
    - **Property 3: Role-Screen Restriction**
    - **Validates: Requirements 6.1, 6.2, 6.3**


- [x] 3. Implement EMR subscription service
  - [x] 3.1 Create EMRSubscriptionService class
    - Implement createSubscription() with Razorpay integration
    - Implement getActiveSubscription() for clinic
    - Implement checkExpiry() and auto-restrict logic
    - _Requirements: 1.3, 1.4, 9.1_
  - [x] 3.2 Implement subscription expiry handling
    - Create scheduled job to check expiring subscriptions
    - Send reminder notifications at 30, 7, 1 days
    - Auto-restrict access on expiry
    - _Requirements: 1.4, 9.2_
  - [ ]* 3.3 Write property test for expiry enforcement
    - **Property 4: Subscription Expiry Enforcement**
    - **Validates: Requirements 1.4, 10.1**

- [x] 4. Create EMR subscription API routes
  - [x] 4.1 Create emrSubscriptionRoutes.js
    - GET /api/emr/plans - List available plans
    - POST /api/emr/subscribe - Create subscription
    - GET /api/emr/subscription - Get clinic's subscription
    - POST /api/emr/renew - Renew subscription
    - _Requirements: 1.1, 1.2, 9.1, 9.3_
  - [x] 4.2 Create EMR screen access routes
    - GET /api/emr/screens - Get available screens for clinic
    - GET /api/emr/access/:screenId - Check screen access
    - _Requirements: 2.1, 2.2_
  - [x] 4.3 Register routes in server.js

    - Mount /api/emr routes
    - _Requirements: 1.1_

- [ ] 5. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement walk-in patient registration

  - [x] 6.1 Create WalkInPatientService
    - Implement registerWalkIn() for new patients
    - Implement searchExisting() to find returning patients
    - Implement linkToClinic() for patient-clinic association
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 6.2 Create walk-in patient API routes
    - POST /api/emr/patients/walk-in - Register walk-in
    - GET /api/emr/patients/search - Search patients
    - _Requirements: 7.1, 7.2_
  - [ ]* 6.3 Write property test for walk-in integration
    - **Property 5: Walk-in Patient Integration**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 7. Create EMR Visit model and service


  - [x] 7.1 Create EMRVisit MongoDB model
    - Define schema with patient, clinic, doctor references
    - Include clinical data fields (vitals, notes, diagnosis)
    - Add audit fields (createdBy, updatedBy)
    - _Requirements: 4.2, 4.3_
  - [x] 7.2 Create EMRVisitService
    - Implement createVisit() for new visits
    - Implement updateVisit() with audit logging
    - Implement getPatientVisits() for history
    - _Requirements: 3.2, 4.5_

- [x] 8. Create Clinic Staff model and service
  - [x] 8.1 Create ClinicStaff MongoDB model
    - Define schema with clinic, user, role, permissions
    - Add indexes for clinicId and userId
    - _Requirements: 5.5, 6.4_
  - [x] 8.2 Create ClinicStaffService
    - Implement inviteStaff() for adding team members
    - Implement updateRole() for permission changes
    - Implement getClinicStaff() for listing
    - _Requirements: 5.5, 6.4_

- [x] 9. Implement audit logging (Advanced plan)
  - [x] 9.1 Create EMRAuditLog model
    - Define schema with user, action, entity, changes, timestamp
    - Add indexes for clinicId and timestamp
    - _Requirements: 5.4_
  - [x] 9.2 Create audit logging middleware
    - Intercept EMR data modifications
    - Record before/after values
    - _Requirements: 5.4_
  - [ ]* 9.3 Write property test for audit completeness
    - **Property 6: Audit Trail Completeness**
    - **Validates: Requirements 5.4**

- [ ] 10. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Create frontend EMR navigation component
  - [x] 11.1 Create EMRSidebar component
    - Display screens based on subscription and role
    - Show locked indicators for unavailable screens
    - Display subscription status badge
    - _Requirements: 2.2, 8.1_
  - [x] 11.2 Create LockedScreen component
    - Display upgrade CTA with plan comparison
    - Show feature description
    - _Requirements: 2.2_
  - [x] 11.3 Create SubscriptionBadge component
    - Show plan name and days remaining
    - Warning styling when expiring soon
    - _Requirements: 1.5_

- [x] 12. Create Basic plan EMR screens
  - [x] 12.1 Create PatientRegistration screen
    - Form for walk-in patient registration
    - Search existing patients
    - Mobile-optimized for tablets
    - _Requirements: 3.1, 7.1, 7.2, 8.3_
  - [x] 12.2 Create VisitHistory screen
    - List all patient visits
    - Filter by date, doctor, type
    - _Requirements: 3.2_
  - [x] 12.3 Create SystematicHistoryEMR screen
    - Integrate existing SystematicHistoryForm
    - Doctor-facing view with edit capability
    - _Requirements: 3.3_
  - [x] 12.4 Create BasicPrescription screen
    - Prescription creation form
    - Medicine search and dosage
    - Print functionality
    - _Requirements: 3.4_
  - [x] 12.5 Create UploadedReports screen
    - View patient uploaded documents
    - Cloudinary integration
    - _Requirements: 3.5_

- [x] 13. Create Standard plan EMR screens
  - [x] 13.1 Create DoctorNotes screen
    - Clinical notes editor
    - Diagnosis entry with ICD-10 codes
    - _Requirements: 4.2_
  - [x] 13.2 Create FollowUpScheduling screen
    - Schedule follow-up visits
    - Calendar view
    - _Requirements: 4.3_
  - [x] 13.3 Create MedicationHistory screen
    - All prescriptions for patient
    - Timeline view
    - _Requirements: 4.4_
  - [x] 13.4 Create PatientTimeline screen
    - Chronological health events
    - Visits, prescriptions, reports
    - _Requirements: 4.5_

- [x] 14. Create Advanced plan EMR screens





  - [x] 14.1 Create EMRDashboard screen


    - Key clinic metrics
    - Today's appointments
    - Quick actions
    - _Requirements: 5.2_
  - [x] 14.2 Create AnalyticsReports screen


    - Patient statistics
    - Revenue reports
    - Visit trends
    - _Requirements: 5.3_
  - [x] 14.3 Create AuditLogs screen


    - Searchable audit log viewer
    - Filter by user, action, date
    - _Requirements: 5.4_
  - [x] 14.4 Create StaffManagement screen


    - Invite/remove staff
    - Role assignment
    - _Requirements: 5.5_
  - [x] 14.5 Create DataExport screen


    - Patient record PDF export
    - Bulk export options
    - _Requirements: 5.6, 10.2, 10.3_

- [x] 15. Create subscription management screens


  - [x] 15.1 Create SubscriptionPlans screen


    - Plan comparison table
    - Pricing display
    - _Requirements: 1.1, 1.2_
  - [x] 15.2 Create SubscriptionCheckout screen


    - Razorpay payment integration
    - Plan selection and duration
    - _Requirements: 9.1_

  - [x] 15.3 Create SubscriptionStatus screen

    - Current plan details
    - Renewal options
    - Invoice history
    - _Requirements: 1.5, 9.3_

- [x] 16. Apply clinical UI styling



  - [x] 16.1 Create EMR-specific CSS


    - Clean, professional clinical design
    - No ads or marketplace elements
    - Tablet and desktop optimized
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 16.2 Add "EMR powered by HealthSync" branding

    - Subtle footer branding
    - _Requirements: 8.2_

- [x] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
