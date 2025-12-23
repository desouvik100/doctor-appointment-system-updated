# Implementation Plan: EMR Clinical Features

## Overview

This implementation plan covers the enhanced clinical features for the HealthSync EMR system: vitals recording with validation and trends, lab test ordering and tracking, medical history forms, ICD-10 diagnosis coding, and drug interaction alerts. The implementation builds on the existing EMR infrastructure and integrates with external APIs.

## Tasks

- [x] 1. Set up data models and database schemas
  - [x] 1.1 Create MedicalHistory model with allergies, chronic conditions, family history, surgical history, and current medications schemas
    - Define mongoose schema with all nested structures
    - Add indexes for patientId and clinicId
    - Include validation for required fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 1.2 Create LabOrder model with tests array, status tracking, and result attachments
    - Define schema with order number generation
    - Include test status enum and result structure
    - Add reference range and abnormal flagging fields
    - _Requirements: 2.3, 2.5, 2.7, 2.8_

  - [x] 1.3 Create DrugInteractionLog model for audit trail of interaction checks and overrides
    - Define schema with interaction details and override reasons
    - Include timestamps and doctor references
    - _Requirements: 5.5, 5.8_

  - [x] 1.4 Update EMRVisit model to include enhanced vitals with blood sugar field
    - Add bloodSugar field with value, type (fasting/random/postMeal), and unit
    - Ensure backward compatibility with existing vitals
    - _Requirements: 1.1, 1.7_

- [-] 2. Implement vitals recording backend
  - [x] 2.1 Create vitals validation service with range checking and abnormal flagging
    - Implement validateVitals function with all vital types
    - Define normal ranges and abnormal thresholds
    - Return validation result with isValid and abnormalFlags
    - _Requirements: 1.2, 1.3, 1.6, 1.7_

  - [x] 2.2 Write property test for vitals range validation
    - **Property 1: Vitals Range Validation and Abnormal Flagging**
    - **Validates: Requirements 1.2, 1.3, 1.6, 1.7**

  - [x] 2.3 Implement temperature unit conversion utility (F↔C)
    - Create convertTemperature function with bidirectional conversion
    - Handle precision to avoid floating-point errors
    - _Requirements: 1.4_

  - [x] 2.4 Write property test for temperature conversion round-trip
    - **Property 2: Temperature Unit Conversion Round-Trip**
    - **Validates: Requirements 1.4**

  - [x] 2.5 Implement BMI calculation utility with unit handling
    - Create calculateBMI function accepting kg/lbs and cm/ft
    - Convert units internally before calculation
    - _Requirements: 1.5_

  - [x] 2.6 Write property test for BMI calculation correctness
    - **Property 3: BMI Calculation Correctness**
    - **Validates: Requirements 1.5**

  - [x] 2.7 Create vitals API endpoints (record, get, trends)
    - POST /api/emr/visits/:visitId/vitals - Record vitals
    - GET /api/emr/patients/:patientId/vitals/trends - Get trends data
    - Include validation middleware
    - _Requirements: 1.8, 6.3, 6.4, 6.5_

- [x] 3. Checkpoint - Vitals backend complete
  - Ensure all vitals tests pass, ask the user if questions arise.

- [x] 4. Implement medical history backend
  - [x] 4.1 Create medical history service with CRUD operations
    - Implement createOrUpdateHistory, getHistory, updateAllergies, updateConditions, updateMedications
    - Handle partial updates for each section
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.2 Write property test for medical history data completeness
    - **Property 4: Medical History Data Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

  - [x] 4.3 Create medical history API endpoints
    - POST/GET /api/emr/patients/:patientId/history
    - PUT endpoints for allergies, conditions, medications sections
    - _Requirements: 3.7_

- [x] 5. Implement lab orders backend
  - [x] 5.1 Create lab test catalog as static data file
    - Define common tests with code, name, category, turnaround time
    - Include pre-built panels (Diabetic, Cardiac, Annual Checkup)
    - _Requirements: 2.1, 2.2, 7.1_

  - [x] 5.2 Create lab order service with order creation and status management
    - Implement createOrder, updateStatus, addResults functions
    - Generate unique order numbers
    - Handle status transitions validation
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 5.3 Write property test for lab order lifecycle and result flagging
    - **Property 5: Lab Order Lifecycle and Result Flagging**
    - **Validates: Requirements 2.3, 2.5, 2.7, 2.8**

  - [x] 5.4 Create lab order API endpoints
    - POST /api/emr/lab-orders - Create order
    - PUT /api/emr/lab-orders/:orderId/status - Update status
    - POST /api/emr/lab-orders/:orderId/results - Add results
    - GET /api/emr/lab-tests/catalog - Get test catalog
    - _Requirements: 2.1, 2.6_

- [x] 6. Checkpoint - Medical history and lab orders complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement ICD-10 diagnosis coding backend
  - [x] 7.1 Create ICD-10 search service with NIH API integration
    - Implement searchICD10 function calling NIH Clinical Tables API
    - Add caching for frequently searched terms
    - Handle API errors with fallback to cached codes
    - _Requirements: 4.1, 4.2_

  - [x] 7.2 Create diagnosis service for visit diagnosis management
    - Implement addDiagnosis, getDiagnoses functions
    - Store both code and description
    - Support primary/secondary/differential classification
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 7.3 Write property test for ICD-10 search and diagnosis storage
    - **Property 6: ICD-10 Search and Diagnosis Storage**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.7**

  - [x] 7.4 Create diagnosis API endpoints
    - GET /api/emr/icd10/search?q=term - Search ICD-10 codes
    - POST /api/emr/visits/:visitId/diagnoses - Add diagnosis
    - GET /api/emr/visits/:visitId/diagnoses - Get diagnoses
    - _Requirements: 4.6, 4.7_

- [x] 8. Implement drug interaction checking backend
  - [x] 8.1 Create drug interaction database JSON file
    - Define common drug-drug interactions with severity levels
    - Include drug classes for class-based matching
    - Add mechanism and clinical effect descriptions
    - _Requirements: 5.2, 5.4_

  - [x] 8.2 Create drug interaction service
    - Implement checkInteractions function
    - Match by drug name and drug class
    - Return severity and details for each interaction
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.3 Write property test for drug interaction detection and severity
    - **Property 7: Drug Interaction Detection and Severity**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - ✅ All 20 tests pass (6 property-based + 14 unit tests)

  - [x] 8.4 Implement allergy cross-checking in interaction service
    - Check prescribed drugs against patient allergies
    - Match by drug name and drug class
    - Generate allergy alerts with severity
    - Added: checkDrugAllergies, checkMultipleDrugAllergies, checkPrescriptionSafety
    - _Requirements: 5.6, 5.7_

  - [x] 8.5 Write property test for allergy cross-checking
    - **Property 8: Allergy Cross-Checking During Prescription**
    - **Validates: Requirements 5.6, 5.7**
    - ✅ All 35 tests pass (6 property tests for Property 8 + 9 unit tests for allergy checking)

  - [x] 8.6 Implement interaction override logging
    - Create logOverride function
    - Store doctor ID, reason, timestamp
    - Link to prescription and visit
    - Added: interactionLogService.js with createInteractionLog, logOverride, getOverrideAuditTrail, etc.
    - _Requirements: 5.5, 5.8_

  - [x] 8.7 Write property test for interaction override logging
    - **Property 9: Interaction Override Logging**
    - **Validates: Requirements 5.5, 5.8**
    - ✅ All 18 tests pass (7 property-based + 11 unit tests)

  - [x] 8.8 Create drug interaction API endpoints
    - POST /api/emr/interactions/check - Check interactions
    - POST /api/emr/interactions/override - Log override
    - GET /api/emr/interactions/log/:visitId - Get interaction log
    - _Requirements: 5.1, 5.5_

- [x] 9. Implement clinical decision support
  - [x] 9.1 Create critical alerts service for vital thresholds
    - Define critical thresholds (BP > 180/120, SpO2 < 90%, etc.)
    - Generate immediate alerts for critical values
    - _Requirements: 9.1_

  - [x] 9.2 Write property test for clinical decision support alerts
    - **Property 10: Clinical Decision Support Alerts**
    - **Validates: Requirements 9.1**
    - ✅ All 26 tests pass (10 property-based + 16 unit tests)

  - [x] 9.3 Implement elderly patient safety checks (age > 65)
    - Add age-based interaction severity escalation
    - Flag high-risk medications for elderly
    - _Requirements: 9.3_

- [x] 10. Checkpoint - Backend services complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 11. Implement frontend vitals components
  - [x] 11.1 Create VitalsRecorder component with input fields and validation
    - Build form with all vital sign inputs
    - Implement real-time validation with error display
    - Show abnormal value highlighting
    - Add unit toggle for temperature and weight
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 11.2 Create VitalsTrends component with Chart.js charts
    - Implement line charts for each vital type
    - Add normal range bands as shaded areas
    - Include time period selector (1m, 3m, 6m, 1y)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 11.3 Add VitalsRecorder to EMR visit workflow
    - Integrate into existing EMRDashboard
    - Make vitals first step in visit flow
    - Added VitalsRecorder and VitalsTrends modals to ClinicDashboardPro
    - Wired up save callback to create visit and record vitals
    - Fetch and display last recorded vitals in summary grid
    - _Requirements: 10.1_

- [x] 12. Implement frontend medical history components
  - [x] 12.1 Create MedicalHistoryForm component with tabbed sections
    - Build tabs for allergies, conditions, family history, surgical history, medications
    - Implement add/edit/delete for each section
    - Show severity badges for allergies
    - Created MedicalHistoryForm.js with 5 tabbed sections
    - Created MedicalHistoryForm.css with responsive styling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 12.2 Create MedicalHistorySummary component for patient view
    - Display critical items (allergies, active conditions) prominently
    - Show allergy badges on clinical screens
    - _Requirements: 3.8, 9.4_

  - [x] 12.3 Integrate medical history into patient view
    - Add history summary to patient details
    - Link to full history form
    - _Requirements: 10.2_

- [x] 13. Implement frontend lab order components
  - [x] 13.1 Create LabOrderForm component with test catalog search
    - Build searchable test selector
    - Add urgency and instructions fields
    - Include panel quick-select
    - Created LabOrderForm.js with searchable catalog, category filtering, panel tabs
    - Created LabOrderForm.css with responsive styling
    - Exported from emr/index.js
    - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2_

  - [x] 13.2 Create LabOrderTracker component with status display
    - Show order status with visual indicators
    - Display result values with abnormal highlighting
    - Allow result document attachment
    - Created LabOrderTracker.js with progress steps, status timeline, results table
    - Created LabOrderTracker.css with responsive styling
    - Exported from emr/index.js
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 13.3 Create printable lab requisition form
    - Generate PDF-ready requisition with patient details
    - Include ordered tests and instructions
    - Created LabRequisitionPrint.js with print-optimized layout
    - Created LabRequisitionPrint.css with print media queries
    - Exported from emr/index.js
    - _Requirements: 2.4_

- [x] 14. Implement frontend diagnosis components
  - [x] 14.1 Create DiagnosisCoder component with ICD-10 search
    - Build autocomplete search calling backend API
    - Display code and description in results
    - Allow primary/secondary/differential selection
    - Created DiagnosisCoder.js with debounced search, type selection, popular codes
    - Created DiagnosisCoder.css with responsive styling
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

  - [x] 14.2 Create DiagnosisList component for visit display
    - Show all diagnoses with codes and descriptions
    - Allow editing and removal
    - Created DiagnosisList.js with inline editing, delete confirmation
    - Created DiagnosisList.css with type-based styling
    - _Requirements: 4.5_

  - [x] 14.3 Add diagnosis prompt to visit completion flow
    - Check if diagnosis entered before completing visit
    - Show prompt if missing
    - Created DiagnosisPrompt.js with useDiagnosisPrompt hook
    - Created DiagnosisPrompt.css with responsive styling
    - _Requirements: 10.4_

- [x] 15. Implement frontend drug interaction components
  - [x] 15.1 Create DrugInteractionChecker component
    - Display interaction alerts with severity colors
    - Show mechanism and clinical effects
    - Include acknowledge/override buttons
    - Created DrugInteractionChecker.js with severity-based styling, inline override modal
    - Created DrugInteractionChecker.css with responsive styling
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 15.2 Create AllergyAlert component
    - Display allergy warnings prominently
    - Show matching allergen and reaction
    - Created AllergyAlert.js with AllergyAlert, AllergyAlertBanner, AllergyAlertList exports
    - Created AllergyAlert.css with severity-based styling
    - _Requirements: 5.7_

  - [x] 15.3 Create InteractionOverrideModal component
    - Require reason input for override
    - Log override on confirmation
    - Created InteractionOverrideModal.js with common reasons, monitoring plan, audit notice
    - Created InteractionOverrideModal.css with responsive styling
    - Note: Inline version also exists in DrugInteractionChecker for simpler use cases
    - _Requirements: 5.5_

  - [x] 15.4 Integrate interaction checking into prescription flow
    - Trigger check when medications added
    - Block finalization for contraindicated interactions without override
    - Updated BasicPrescription.js with DrugInteractionChecker integration
    - Added allergy banner, interaction status indicator, checker modal
    - Save button disabled until critical interactions resolved
    - _Requirements: 10.3_

- [x] 16. Implement subscription tier gating
  - [x] 16.1 Add feature flags for clinical features by subscription tier
    - Basic: vitals, lab orders, medical history, basic prescription, patient registration
    - Standard: + ICD-10, drug interactions, vitals trends, doctor notes, follow-up scheduling
    - Advanced: + custom panels, interaction audit, EMR dashboard, analytics, audit logs, data export
    - Created featureFlags.js with EMR_FEATURES config, PLAN_HIERARCHY, helper functions
    - _Requirements: Design subscription tier table_

  - [x] 16.2 Create LockedFeature wrapper component for gated features
    - Show upgrade prompt for locked features
    - Check subscription before rendering
    - Created LockedFeature.js with card and inline variants
    - Created LockedFeature.css with responsive styling
    - Added useFeatureAccess hook and withFeatureAccess HOC
    - _Requirements: 2.2 (from clinic-emr-subscription spec)_

- [x] 17. Final integration and testing
  - [x] 17.1 Wire all components into EMRDashboard
    - Add navigation to new features
    - Ensure consistent styling
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 17.2 Implement data export with clinical features
    - Include vitals, labs, history, diagnoses in PDF export
    - _Requirements: 10.5_

  - [x] 17.3 Write integration tests for end-to-end clinical workflow
    - Test complete visit flow with all clinical features
    - Verify data persistence and retrieval
    - Created clinicalWorkflow.integration.test.js with 36 tests covering:
      - Complete visit flow (vitals, alerts, history, labs, diagnosis, drug interactions)
      - Vitals validation edge cases
      - Drug interaction detection
      - Allergy cross-checking
      - Critical alerts generation
      - Elderly patient safety
      - Medical history and diagnosis validation
      - Lab test catalog
      - End-to-end workflow simulation

- [x] 18. Final checkpoint
  - All unit tests pass (146+ tests across 10 test suites)
  - Integration tests for clinical workflow pass (36 tests)
  - All frontend components created and exported
  - All backend services implemented with property-based tests
  - EMR clinical features spec implementation complete

## Notes

- All tasks are required including property-based tests for comprehensive coverage
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend tasks should be completed before corresponding frontend tasks
- Drug interaction database will need periodic updates for new medications
