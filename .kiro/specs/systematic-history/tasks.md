# Implementation Plan

- [-] 1. Set up data models and backend infrastructure

  - [x] 1.1 Create SystematicHistory MongoDB model


    - Define schema with all 9 body systems, past history, medications, allergies
    - Add indexes for userId and appointmentId
    - Include version tracking and timestamps
    - _Requirements: 6.1, 6.5_


  - [ ] 1.2 Create symptom configuration constants
    - Define BODY_SYSTEMS object with names, icons, and symptom arrays
    - Define SPECIALIZATION_RULES for AI matching
    - Export as shared constants for frontend/backend
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 1.3 Write property test for history persistence round-trip
    - **Property 10: History Persistence Round-Trip**


    - **Validates: Requirements 6.1, 6.5**

- [ ] 2. Implement SystematicHistoryService
  - [x] 2.1 Create SystematicHistoryService class

    - Implement create() method for new history
    - Implement getByAppointment() method
    - Implement getLatestByUser() method
    - Implement getUserHistoryVersions() method
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 2.2 Implement version management for edits
    - Create update() method that preserves original version
    - Increment version number on each edit
    - _Requirements: 6.4_
  - [ ] 2.3 Write property test for version preservation
    - **Property 11: Version Preservation on Edit**
    - **Validates: Requirements 6.4**




- [ ] 3. Implement DoctorMatcherService (AI Recommendations)
  - [ ] 3.1 Create DoctorMatcherService class
    - Implement getRecommendations() method
    - Parse symptoms and match against SPECIALIZATION_RULES
    - Calculate confidence scores
    - _Requirements: 5.1_
  - [x] 3.2 Implement specialization matching logic

    - Match respiratory symptoms to Pulmonologist
    - Match cardiac symptoms to Cardiologist
    - Match musculoskeletal to Orthopedic/Rheumatologist
    - Match neurological to Neurologist
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  - [x] 3.3 Implement multi-system detection

    - Count affected body systems
    - Recommend General Physician when 3+ systems affected
    - _Requirements: 5.6_
  - [ ] 3.4 Write property test for symptom-to-specialist mapping
    - **Property 8: Symptom-to-Specialist Mapping**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
  - [ ] 3.5 Write property test for multi-system GP rule
    - **Property 9: Multi-System General Physician Rule**
    - **Validates: Requirements 5.6**

- [x] 4. Create REST API endpoints


  - [x] 4.1 Create systematicHistoryRoutes.js


    - POST /api/systematic-history - Create new history
    - GET /api/systematic-history/appointment/:id - Get by appointment
    - GET /api/systematic-history/user/:id/latest - Get user's latest
    - GET /api/systematic-history/user/:id/versions - Get all versions
    - PUT /api/systematic-history/:id - Update history
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 4.2 Create recommendations endpoint

    - POST /api/systematic-history/recommendations - Get AI recommendations
    - _Requirements: 5.1_
  - [x] 4.3 Register routes in server.js


    - Add route mounting for /api/systematic-history
    - _Requirements: 6.1_

- [ ] 5. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 6. Create frontend SymptomChip component

  - [x] 6.1 Create SymptomChip.js component


    - Implement toggleable chip with Yes/No state
    - Add duration selector (1-3 days, 1 week, >1 week)
    - Add severity slider (1-5 scale)
    - Style with large touch targets (48px minimum)
    - _Requirements: 1.3, 1.4, 8.1_
  - [ ] 6.2 Write property test for symptom detail requirement
    - **Property 2: Symptom Detail Requirement**
    - **Validates: Requirements 1.4**

- [-] 7. Create SystematicHistoryForm component

  - [x] 7.1 Create multi-step form structure


    - Implement step-by-step card layout
    - Add progress indicator showing current step
    - Create navigation between steps
    - _Requirements: 1.1, 1.2_
  - [x] 7.2 Implement body system sections

    - Create section for each of 9 body systems
    - Display symptom chips for each system
    - Handle section completion and skip
    - _Requirements: 2.1, 1.5_
  - [x] 7.3 Implement past history section

    - Add searchable condition selector
    - Add medication input with auto-suggestions
    - Add allergy section
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.4 Implement history pre-fill

    - Fetch user's latest history on mount
    - Pre-populate past history and medications
    - Show option to use previous or start fresh
    - _Requirements: 3.4, 6.2_
  - [x] 7.5 Add file upload for reports

    - Integrate with existing Cloudinary upload
    - Allow multiple file attachments
    - _Requirements: 3.5_
  - [ ] 7.6 Write property test for step progression
    - **Property 1: Step Progression Consistency**
    - **Validates: Requirements 1.2**
  - [ ] 7.7 Write property test for skip section handling
    - **Property 3: Skip Section Handling**
    - **Validates: Requirements 1.5**
  - [ ] 7.8 Write property test for history pre-fill
    - **Property 4: History Pre-fill Consistency**
    - **Validates: Requirements 3.4**

- [-] 8. Create SystematicHistorySummary component

  - [x] 8.1 Create doctor-facing summary display

    - Group symptoms by body system
    - Show checkmarks for affected systems
    - Display duration and severity for each symptom
    - Show "No" indicator for empty systems
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 8.2 Add past history and medications display

    - Highlight past conditions prominently
    - Show current medications list
    - Display allergies with warning styling
    - _Requirements: 4.5_
  - [x] 8.3 Add compact and expandable modes

    - Create condensed view for clinic queue
    - Add expand/collapse functionality
    - _Requirements: 7.2_
  - [x] 8.4 Add print functionality

    - Generate printable format
    - Include all history details
    - _Requirements: 7.4_
  - [ ] 8.5 Write property test for summary display grouping
    - **Property 5: Summary Display Grouping**
    - **Validates: Requirements 4.2**
  - [ ] 8.6 Write property test for duration/severity display
    - **Property 6: Duration and Severity Display**
    - **Validates: Requirements 4.3**
  - [ ] 8.7 Write property test for empty system indicator
    - **Property 7: Empty System Indicator**
    - **Validates: Requirements 4.4**

- [x] 9. Create AIRecommendations component



  - [x] 9.1 Create recommendations display

    - Show recommended specializations with confidence
    - Display reason for each recommendation
    - Add click handler to filter doctors
    - _Requirements: 5.1_

- [x] 10. Integrate with booking flow
  - [x] 10.1 Add systematic history step to CinemaStyleBooking
    - Insert history form after doctor selection
    - Make it optional but encouraged
    - Save history with appointment
    - _Requirements: 1.1, 6.1_
  - [ ] 10.2 Add AI recommendations to doctor search
    - Show recommendations after history completion
    - Allow filtering by recommended specialization
    - _Requirements: 5.1_

- [-] 11. Integrate with doctor dashboard
  - [x] 11.1 Add SystematicHistorySummary to appointment view
    - Display summary card in appointment details
    - Show when history is available
    - _Requirements: 4.1, 7.1_

- [ ] 12. Integrate with clinic dashboard
  - [ ] 12.1 Add history indicators to queue view
    - Show completion status for each patient
    - Add expandable history preview
    - _Requirements: 7.1, 7.3_
  - [ ] 12.2 Write property test for queue completion indicator
    - **Property 12: Clinic Queue Completion Indicator**
    - **Validates: Requirements 7.3**

- [ ] 13. Add mobile optimizations
  - [ ] 13.1 Implement mobile-specific styling
    - Ensure 48px minimum touch targets
    - Add horizontal scroll for symptom chips
    - Implement haptic feedback on interactions
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 13.2 Implement auto-save and offline support
    - Save form progress to localStorage
    - Queue submissions when offline
    - Sync when connection restores
    - _Requirements: 8.4, 8.5_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
