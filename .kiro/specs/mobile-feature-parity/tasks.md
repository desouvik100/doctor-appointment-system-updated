# Implementation Plan: Mobile Feature Parity

## Overview

This implementation plan brings full feature parity to the HealthSync Android native mobile application. The plan is organized into 5 phases over 18 weeks, starting with core patient features and progressively adding advanced functionality. Each task builds on previous work and includes property-based tests for critical functionality.

## Tasks

- [x] 1. Set up enhanced project infrastructure
  - [x] 1.1 Install additional React Native dependencies
    - Install @react-native-firebase/messaging for push notifications
    - Install react-native-biometrics for fingerprint/face auth
    - Install react-native-image-picker for camera/gallery
    - Install @react-native-community/geolocation for location
    - Install react-native-add-calendar-event for calendar integration
    - Install @react-native-community/netinfo for offline detection
    - Install react-native-keychain for secure storage
    - Install fast-check for property-based testing
    - _Requirements: 1.4, 5.1, 6.2, 14.1, 17.2_

  - [x] 1.2 Create API service layer
    - Create `mobile/src/services/api/apiClient.js` with axios instance
    - Add request interceptor for auth token injection
    - Add response interceptor for token refresh
    - Create service modules (auth, appointments, doctors, wallet, etc.)
    - _Requirements: 1.6, 1.7_

  - [x] 1.3 Create offline storage manager
    - Create `mobile/src/services/offline/OfflineManager.js`
    - Implement data caching with AsyncStorage
    - Implement action queue for offline operations
    - Implement sync on reconnection
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 1.4 Write property test for offline cache round-trip
    - **Property 15: Offline Cache Round-Trip**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

- [x] 2. Implement enhanced authentication
  - [x] 2.1 Create RegisterScreen with form validation
    - Create `mobile/src/screens/auth/RegisterScreen.js`
    - Add email, phone, password, name fields with validation
    - Integrate with auth API
    - _Requirements: 1.1_

  - [x] 2.2 Create OTPVerificationScreen
    - Create `mobile/src/screens/auth/OTPVerificationScreen.js`
    - Add OTP input with auto-focus
    - Add resend OTP functionality
    - _Requirements: 1.2_

  - [x] 2.3 Create ForgotPasswordScreen
    - Create `mobile/src/screens/auth/ForgotPasswordScreen.js`
    - Support email and phone reset options
    - _Requirements: 1.5_

  - [x] 2.4 Implement biometric authentication
    - Add biometric prompt to LoginScreen
    - Store credentials securely with react-native-keychain
    - _Requirements: 1.4_

  - [x] 2.5 Implement secure token storage
    - Use react-native-keychain for token storage
    - Implement token refresh logic
    - _Requirements: 1.6, 1.7_

  - [ ]* 2.6 Write property test for auth token persistence
    - **Property 1: Authentication Token Persistence Round-Trip**
    - **Validates: Requirements 1.1, 1.6**

  - [x] 2.7 Implement logout with data clearing
    - Clear all AsyncStorage data on logout
    - Clear secure keychain data
    - Reset navigation to login
    - _Requirements: 1.8_

  - [ ]* 2.8 Write property test for logout data clearing
    - **Property 2: Logout Clears All User Data**
    - **Validates: Requirements 1.8**

- [x] 3. Checkpoint - Authentication complete
  - Ensure all auth tests pass, ask the user if questions arise.

- [x] 4. Enhance HomeScreen with dashboard features
  - [x] 4.1 Create QuickActions component
    - Create `mobile/src/screens/home/components/QuickActions.js`
    - Add grid of service icons (Video Consult, Lab Tests, Medicine, etc.)
    - Navigate to respective screens on tap
    - _Requirements: 2.1, 2.6_

  - [x] 4.2 Create UpcomingAppointments component
    - Create `mobile/src/screens/home/components/UpcomingAppointments.js`
    - Display next 3 appointments with countdown
    - Add "View All" link to appointments screen
    - _Requirements: 2.1_

  - [x] 4.3 Create WalletSummary component
    - Create `mobile/src/screens/home/components/WalletSummary.js`
    - Display balance and loyalty points
    - Add quick "Add Money" button
    - _Requirements: 2.2, 2.3_

  - [x] 4.4 Create HealthTips component
    - Create `mobile/src/screens/home/components/HealthTips.js`
    - Display scrollable health tips cards
    - _Requirements: 2.5_

  - [x] 4.5 Implement pull-to-refresh
    - Add RefreshControl to HomeScreen ScrollView
    - Refresh all dashboard data on pull
    - _Requirements: 2.7_

- [x] 5. Implement doctor search and filtering
  - [x] 5.1 Create DoctorSearchScreen with filters
    - Create `mobile/src/screens/doctors/DoctorSearchScreen.js`
    - Add search bar with debounce
    - Add filter panel (specialization, gender, experience, fees)
    - _Requirements: 3.1, 3.3_

  - [x] 5.2 Create FilterPanel component
    - Create `mobile/src/screens/doctors/components/FilterPanel.js`
    - Add dropdown/chip selectors for each filter
    - Add "Apply" and "Clear" buttons
    - _Requirements: 3.3_

  - [x] 5.3 Create DoctorCard component
    - Create `mobile/src/screens/doctors/components/DoctorCard.js`
    - Display photo, name, specialization, rating, fees
    - Add favorite button
    - _Requirements: 3.2, 3.9_

  - [ ]* 5.4 Write property test for search filter correctness
    - **Property 3: Doctor Search Filter Correctness**
    - **Validates: Requirements 3.1, 3.3**

  - [x] 5.5 Implement favorites functionality
    - Add/remove doctors from favorites
    - Persist favorites to AsyncStorage
    - _Requirements: 3.9_

  - [ ]* 5.6 Write property test for favorites round-trip
    - **Property 6: Favorites List Round-Trip**
    - **Validates: Requirements 3.9**

- [x] 6. Implement doctor profile and booking
  - [x] 6.1 Create DoctorProfileScreen
    - Create `mobile/src/screens/doctors/DoctorProfileScreen.js`
    - Display full profile with bio, education, experience
    - Display reviews and ratings
    - Add "Book Appointment" button
    - _Requirements: 3.2_

  - [x] 6.2 Create SlotSelectionScreen
    - Create `mobile/src/screens/booking/SlotSelectionScreen.js`
    - Display calendar date picker
    - Display available time slots
    - Support family member selection
    - _Requirements: 3.4, 3.5, 3.6_

  - [ ]* 6.3 Write property test for family member booking
    - **Property 4: Family Member Booking Association**
    - **Validates: Requirements 3.6**

  - [x] 6.4 Create PaymentScreen with Razorpay
    - Create `mobile/src/screens/booking/PaymentScreen.js`
    - Integrate Razorpay SDK
    - Handle payment success/failure
    - _Requirements: 3.7_

  - [x] 6.5 Create BookingConfirmationScreen
    - Create `mobile/src/screens/booking/ConfirmationScreen.js`
    - Display booking details
    - Generate and display QR code
    - Add to calendar option
    - _Requirements: 3.8_

  - [ ]* 6.6 Write property test for QR code round-trip
    - **Property 5: QR Code Booking Round-Trip**
    - **Validates: Requirements 3.8, 4.5**

- [x] 7. Checkpoint - Doctor search and booking complete
  - Ensure all booking tests pass, ask the user if questions arise.

- [x] 8. Enhance appointment management
  - [x] 8.1 Enhance AppointmentsScreen with tabs
    - Add tabs for Upcoming, Past, Cancelled
    - Display appointments in each tab
    - _Requirements: 4.1_

  - [x] 8.2 Create AppointmentDetailsScreen
    - Create `mobile/src/screens/appointments/AppointmentDetailsScreen.js`
    - Display full appointment details
    - Add reschedule and cancel buttons
    - _Requirements: 4.6_

  - [x] 8.3 Create RescheduleScreen
    - Create `mobile/src/screens/appointments/RescheduleScreen.js`
    - Display available slots for rescheduling
    - Confirm reschedule action
    - _Requirements: 4.2_

  - [ ]* 8.4 Write property test for reschedule persistence
    - **Property 7: Appointment Reschedule Persistence**
    - **Validates: Requirements 4.2**

  - [x] 8.5 Create CancelModal component
    - Create `mobile/src/screens/appointments/components/CancelModal.js`
    - Add cancellation reason selection
    - Show refund information
    - _Requirements: 4.3_

  - [ ]* 8.6 Write property test for cancellation state
    - **Property 8: Appointment Cancellation State**
    - **Validates: Requirements 4.3**

  - [x] 8.7 Create QueueTracker component
    - Create `mobile/src/screens/appointments/components/QueueTracker.js`
    - Display live queue position
    - Display estimated wait time
    - _Requirements: 4.4_

  - [ ]* 8.8 Write property test for queue position accuracy
    - **Property 9: Queue Position Accuracy**
    - **Validates: Requirements 4.4**

  - [x] 8.9 Implement QR code check-in
    - Add QR scanner to AppointmentDetailsScreen
    - Call check-in API on successful scan
    - _Requirements: 4.5_

- [x] 9. Implement push notifications
  - [x] 9.1 Set up Firebase Cloud Messaging
    - Configure @react-native-firebase/messaging
    - Request notification permissions
    - Register device token with backend
    - _Requirements: 13.1_

  - [x] 9.2 Create notification handlers
    - Handle foreground notifications
    - Handle background notifications
    - Handle notification tap navigation
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 9.3 Create NotificationSettingsScreen
    - Create `mobile/src/screens/profile/NotificationSettingsScreen.js`
    - Add toggles for each notification type
    - Add sound/silent mode toggle
    - _Requirements: 13.6, 13.7_

  - [ ]* 9.4 Write property test for notification scheduling
    - **Property 16: Notification Scheduling Accuracy**
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 10. Checkpoint - Core patient features complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement health records
  - [x] 11.1 Create MedicalTimelineScreen
    - Create `mobile/src/screens/records/MedicalTimelineScreen.js`
    - Display chronological health events
    - Filter by event type
    - _Requirements: 6.1_

  - [x] 11.2 Create UploadReportScreen
    - Create `mobile/src/screens/records/UploadReportScreen.js`
    - Add camera and gallery options
    - Upload to Cloudinary
    - _Requirements: 6.2_

  - [ ]* 11.3 Write property test for report upload round-trip
    - **Property 10: Report Upload Round-Trip**
    - **Validates: Requirements 6.2**

  - [x] 11.4 Create PrescriptionViewScreen
    - Create `mobile/src/screens/records/PrescriptionViewScreen.js`
    - Display prescription details
    - Add download and share options
    - _Requirements: 6.3_

  - [x] 11.5 Create VitalsHistoryScreen
    - Create `mobile/src/screens/records/VitalsHistoryScreen.js`
    - Display vitals trend charts
    - Filter by date range
    - _Requirements: 6.5_

  - [ ]* 11.6 Write property test for vitals history aggregation
    - **Property 11: Vitals History Aggregation**
    - **Validates: Requirements 6.5**

  - [x] 11.7 Implement offline record access
    - Cache downloaded records locally
    - Display cached records when offline
    - _Requirements: 6.7_

- [ ] 12. Implement systematic history form
  - [ ] 12.1 Create SystematicHistoryScreen
    - Create `mobile/src/screens/systematic-history/SystematicHistoryScreen.js`
    - Implement step-by-step form flow
    - Add progress indicator
    - _Requirements: 7.1_

  - [ ] 12.2 Create BodySystemSection component
    - Create `mobile/src/screens/systematic-history/components/BodySystemSection.js`
    - Display symptom chips for each system
    - _Requirements: 7.2_

  - [ ] 12.3 Create SymptomChip component
    - Create `mobile/src/screens/systematic-history/components/SymptomChip.js`
    - Add duration and severity selectors
    - _Requirements: 7.3_

  - [ ] 12.4 Create PastHistorySection component
    - Create `mobile/src/screens/systematic-history/components/PastHistorySection.js`
    - Add medical history, medications, allergies inputs
    - _Requirements: 7.4, 7.5_

  - [ ] 12.5 Implement history pre-fill
    - Fetch previous history on mount
    - Pre-populate form fields
    - _Requirements: 7.7_

  - [ ] 12.6 Create AIRecommendations component
    - Create `mobile/src/screens/systematic-history/components/AIRecommendations.js`
    - Display recommended specialists based on symptoms
    - _Requirements: 7.8_

  - [ ]* 12.7 Write property test for history persistence
    - **Property 12: Systematic History Persistence Round-Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [ ] 13. Implement family members management
  - [ ] 13.1 Create FamilyMembersScreen
    - Create `mobile/src/screens/family/FamilyMembersScreen.js`
    - Display list of family members
    - Add "Add Member" button
    - _Requirements: 8.1_

  - [ ] 13.2 Create AddFamilyMemberScreen
    - Create `mobile/src/screens/family/AddFamilyMemberScreen.js`
    - Add form for member details
    - Add relationship selector
    - _Requirements: 8.1_

  - [ ] 13.3 Create FamilyMemberProfileScreen
    - Create `mobile/src/screens/family/FamilyMemberProfileScreen.js`
    - Display member details
    - Add edit and delete options
    - _Requirements: 8.2, 8.5_

  - [ ]* 13.4 Write property test for family member CRUD
    - **Property 13: Family Member CRUD Consistency**
    - **Validates: Requirements 8.1, 8.2**

- [ ] 14. Implement health wallet
  - [ ] 14.1 Create WalletScreen
    - Create `mobile/src/screens/wallet/WalletScreen.js`
    - Display balance and loyalty points
    - Display recent transactions
    - _Requirements: 9.1_

  - [ ] 14.2 Create AddMoneyScreen
    - Create `mobile/src/screens/wallet/AddMoneyScreen.js`
    - Add amount input
    - Integrate payment gateway
    - _Requirements: 9.2_

  - [ ] 14.3 Create TransactionHistoryScreen
    - Create `mobile/src/screens/wallet/TransactionHistoryScreen.js`
    - Display all transactions with filters
    - _Requirements: 9.1_

  - [ ]* 14.4 Write property test for wallet balance calculation
    - **Property 14: Wallet Balance Calculation**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ] 15. Checkpoint - Health records and wallet complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement video consultation
  - [ ] 16.1 Create VideoConsultationScreen
    - Create `mobile/src/screens/services/VideoConsultationScreen.js`
    - Integrate WebRTC for video calls
    - Add local and remote video views
    - _Requirements: 5.1_

  - [ ] 16.2 Implement media controls
    - Add mute/unmute audio button
    - Add video on/off button
    - Add end call button
    - _Requirements: 5.2_

  - [ ] 16.3 Create ConnectionQualityIndicator
    - Display connection quality (good/fair/poor)
    - Show warning on degraded quality
    - _Requirements: 5.3, 5.9_

  - [ ] 16.4 Create VirtualWaitingRoomScreen
    - Create `mobile/src/screens/services/VirtualWaitingRoomScreen.js`
    - Display queue position
    - Auto-join when doctor is ready
    - _Requirements: 5.7_

  - [ ] 16.5 Implement in-call chat
    - Add chat panel during consultation
    - Support text messages
    - _Requirements: 5.5_

  - [ ] 16.6 Implement recording consent
    - Show consent modal before recording
    - Track consent status
    - _Requirements: 5.8_

- [ ] 17. Implement medicine and lab services
  - [ ] 17.1 Enhance MedicineScreen
    - Add medicine search
    - Add prescription upload
    - Add order tracking
    - _Requirements: 10.1, 10.4_

  - [ ] 17.2 Enhance LabTestsScreen
    - Add test catalog search
    - Add home collection booking
    - Add result viewing with abnormal flags
    - _Requirements: 10.2, 10.5_

  - [ ] 17.3 Create MedicineReminderScreen
    - Create `mobile/src/screens/services/MedicineReminderScreen.js`
    - Add reminder creation
    - Schedule local notifications
    - _Requirements: 10.6_

- [ ] 18. Implement emergency services
  - [ ] 18.1 Enhance EmergencyScreen
    - Add one-tap SOS button
    - Add ambulance booking
    - Add nearby hospitals map
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ] 18.2 Create EmergencyContactsScreen
    - Create `mobile/src/screens/services/EmergencyContactsScreen.js`
    - Add/edit emergency contacts
    - Share location with contacts
    - _Requirements: 17.4, 17.5_

  - [ ] 18.3 Create MedicalIDScreen
    - Create `mobile/src/screens/services/MedicalIDScreen.js`
    - Display critical medical info
    - Accessible from lock screen
    - _Requirements: 17.6_

- [ ] 19. Checkpoint - Advanced patient features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Implement doctor dashboard
  - [ ] 20.1 Create DoctorDashboardScreen
    - Create `mobile/src/screens/doctor/DoctorDashboardScreen.js`
    - Display today's appointments
    - Display earnings summary
    - _Requirements: 11.1, 11.6_

  - [ ] 20.2 Create PatientQueueScreen
    - Create `mobile/src/screens/doctor/PatientQueueScreen.js`
    - Display patient queue
    - Support check-in/check-out
    - _Requirements: 11.1, 11.2_

  - [ ] 20.3 Create PatientDetailsScreen
    - Create `mobile/src/screens/doctor/PatientDetailsScreen.js`
    - Display patient history
    - Display previous visits
    - _Requirements: 11.3_

  - [ ] 20.4 Create CreatePrescriptionScreen
    - Create `mobile/src/screens/doctor/CreatePrescriptionScreen.js`
    - Add medicine search
    - Add drug interaction alerts
    - _Requirements: 11.4_

  - [ ] 20.5 Create ClinicalNotesScreen
    - Create `mobile/src/screens/doctor/ClinicalNotesScreen.js`
    - Add notes editor
    - Add diagnosis entry with ICD-10 search
    - _Requirements: 11.5_

  - [ ] 20.6 Create DoctorEarningsScreen
    - Create `mobile/src/screens/doctor/DoctorEarningsScreen.js`
    - Display earnings breakdown
    - Display payout history
    - _Requirements: 11.6_

  - [ ] 20.7 Create DoctorScheduleScreen
    - Create `mobile/src/screens/doctor/DoctorScheduleScreen.js`
    - Manage availability
    - Manage leaves
    - _Requirements: 11.7_

- [ ] 21. Implement clinic dashboard
  - [ ] 21.1 Create ClinicDashboardScreen
    - Create `mobile/src/screens/clinic/ClinicDashboardScreen.js`
    - Display clinic queue
    - Display analytics summary
    - _Requirements: 12.1, 12.6_

  - [ ] 21.2 Create WalkInRegistrationScreen
    - Create `mobile/src/screens/clinic/WalkInRegistrationScreen.js`
    - Add patient registration form
    - Search existing patients
    - _Requirements: 12.2_

  - [ ] 21.3 Create QRCheckInScreen
    - Create `mobile/src/screens/clinic/QRCheckInScreen.js`
    - Scan patient QR code
    - Update queue status
    - _Requirements: 12.3_

  - [ ] 21.4 Create StaffPresenceScreen
    - Create `mobile/src/screens/clinic/StaffPresenceScreen.js`
    - Display staff attendance
    - Support check-in/check-out
    - _Requirements: 12.4_

  - [ ] 21.5 Create BasicEMRScreen
    - Create `mobile/src/screens/clinic/BasicEMRScreen.js`
    - Add vitals recording
    - Add basic notes
    - _Requirements: 12.5_

  - [ ] 21.6 Create StaffManagementScreen
    - Create `mobile/src/screens/clinic/StaffManagementScreen.js`
    - Add/remove staff
    - Manage roles
    - _Requirements: 12.7_

- [ ] 22. Checkpoint - Doctor and clinic features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Implement referral system
  - [ ] 23.1 Create ReferralScreen
    - Create `mobile/src/screens/profile/ReferralScreen.js`
    - Display referral code
    - Add share options (WhatsApp, SMS, etc.)
    - _Requirements: 18.1, 18.2_

  - [ ] 23.2 Create ReferralHistoryScreen
    - Create `mobile/src/screens/profile/ReferralHistoryScreen.js`
    - Display referral history
    - Display earnings
    - _Requirements: 18.3_

  - [ ]* 23.3 Write property test for referral code uniqueness
    - **Property 17: Referral Code Uniqueness**
    - **Validates: Requirements 18.1, 18.3**

- [ ] 24. Implement UI/UX enhancements
  - [ ] 24.1 Implement dark mode
    - Create theme context
    - Add dark mode toggle in settings
    - Apply theme to all screens
    - _Requirements: 15.2_

  - [ ] 24.2 Implement multi-language support
    - Set up i18n with react-native-localize
    - Add language selector
    - Translate all strings
    - _Requirements: 15.3_

  - [ ] 24.3 Add haptic feedback
    - Add haptics to button presses
    - Add haptics to success/error states
    - _Requirements: 15.5_

  - [ ] 24.4 Implement accessibility features
    - Add accessibility labels
    - Support screen reader
    - Support font scaling
    - _Requirements: 15.7_

- [ ] 25. Implement medical imaging viewer
  - [ ] 25.1 Create ImagingStudiesScreen
    - Create `mobile/src/screens/services/ImagingStudiesScreen.js`
    - Display list of imaging studies
    - _Requirements: 16.1_

  - [ ] 25.2 Create ImageViewerScreen
    - Create `mobile/src/screens/services/ImageViewerScreen.js`
    - Display DICOM images
    - Add zoom, pan, brightness controls
    - _Requirements: 16.2, 16.3_

  - [ ] 25.3 Implement image sharing
    - Share images with doctors
    - Download for offline viewing
    - _Requirements: 16.5, 16.6_

- [ ] 26. Final integration and testing
  - [ ] 26.1 Update AppNavigator with all new screens
    - Add all new screens to navigation
    - Configure deep linking
    - _Requirements: All_

  - [ ] 26.2 Update BottomTabNavigator for role-based tabs
    - Show different tabs for patient/doctor/clinic
    - _Requirements: 11.1, 12.1_

  - [ ] 26.3 Run all property-based tests
    - Ensure all 17 properties pass
    - Fix any failing tests
    - _Requirements: All_

  - [ ] 26.4 Performance optimization
    - Implement lazy loading for screens
    - Optimize image loading
    - Reduce bundle size
    - _Requirements: 15.6_

- [ ] 27. Final checkpoint - Feature parity complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented
  - Test end-to-end flows on Android device

## Notes

- Tasks marked with `*` are property-based tests (optional but recommended)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Use `fast-check` library for property-based testing
- Test on multiple Android device sizes and versions
- Backend APIs are already implemented - focus is on mobile frontend
