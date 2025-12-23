# Implementation Plan: Advanced Imaging Features

## Overview

This implementation plan covers the advanced imaging capabilities for the HealthSync EMR system: DICOM viewer for medical imaging (X-rays, CT scans, MRIs) and enhanced telemedicine with EMR integration, screen sharing, and recording. The implementation uses Cornerstone.js for DICOM viewing and enhances the existing WebRTC-based video consultation.

## Tasks

- [x] 1. Set up DICOM infrastructure and dependencies
  - [x] 1.1 Install Cornerstone.js packages and dependencies
    - Install @cornerstonejs/core, @cornerstonejs/tools, @cornerstonejs/dicom-image-loader
    - Install dicom-parser for metadata extraction
    - Configure webpack/build for WASM support
    - _Requirements: 1.1, 2.1_

  - [x] 1.2 Create DicomStudy model for storing imaging studies
    - Define mongoose schema with studyInstanceUID, series, images
    - Include patient/visit references and DICOM metadata fields
    - Add indexes for efficient querying
    - _Requirements: 1.2, 1.5_

  - [x] 1.3 Create TelemedicineSession model for consultation tracking
    - Define schema with appointment, participants, recording consent
    - Include screen share events and EMR actions logging
    - Add session status and duration tracking
    - _Requirements: 5.6, 6.6, 9.1, 9.3_

- [x] 2. Implement DICOM upload and storage backend
  - [x] 2.1 Create DICOM parsing service for metadata extraction
    - Implement parseDicomFile function using dicom-parser
    - Extract patient ID, study date, modality, body part, institution
    - Handle multi-frame and multi-series studies
    - _Requirements: 1.2_

  - [x] 2.2 Write property test for DICOM metadata extraction accuracy
    - **Property 2: DICOM Metadata Extraction Accuracy**
    - **Validates: Requirements 1.2, 10.2**

  - [x] 2.3 Create patient ID validation service
    - Implement validatePatientMatch function
    - Compare DICOM patient ID with EMR patient record
    - Return mismatch details for user confirmation
    - _Requirements: 1.3_

  - [x] 2.4 Write property test for patient ID validation
    - **Property 3: Patient ID Validation**
    - **Validates: Requirements 1.3**

  - [x] 2.5 Create imaging storage service with Cloudinary integration
    - Implement uploadDicomStudy function
    - Store images with proper organization (study/series/image)
    - Generate thumbnails for series navigation
    - _Requirements: 1.5, 1.6_

  - [x] 2.6 Create imaging API endpoints
    - POST /api/imaging/upload - Upload DICOM files
    - GET /api/imaging/studies/:studyId - Get study details
    - GET /api/imaging/patients/:patientId/studies - Get patient imaging history
    - _Requirements: 1.1, 1.5, 4.5_

- [x] 3. Checkpoint - DICOM upload backend complete
  - Ensure all upload tests pass, ask the user if questions arise.

- [-] 4. Implement DICOM viewer core functionality
  - [x] 4.1 Create DicomViewer component with Cornerstone.js integration
    - Initialize Cornerstone rendering engine
    - Load and display DICOM images
    - Implement proper aspect ratio handling
    - _Requirements: 2.1_

  - [x] 4.2 Write property test for image rendering dimensions
    - **Property 5: Image Rendering Dimensions**
    - **Validates: Requirements 2.1**
    - Created measurementService.js with all measurement functions
    - Created measurement.property.test.js with 19 passing tests

  - [x] 4.3 Implement zoom and pan controls
    - Add zoom controls (fit, 1:1, custom up to 400%)
    - Implement pan functionality for zoomed images
    - Clamp zoom values to valid range
    - _Requirements: 2.2, 2.3_

  - [x] 4.4 Write property test for zoom range validation
    - **Property 6: Zoom Range Validation**
    - **Validates: Requirements 2.2**
    - Tests included in measurement.property.test.js

  - [x] 4.5 Implement window/level adjustment
    - Add brightness/contrast controls
    - Implement preset values for tissue types (bone, lung, soft tissue, brain)
    - Apply standard DICOM window/level formula
    - _Requirements: 2.4, 2.8_

  - [x] 4.6 Write property test for window/level application
    - **Property 7: Window/Level Application**
    - **Validates: Requirements 2.4**
    - Tests included in measurement.property.test.js

  - [x] 4.7 Implement slice navigation for CT/MRI studies
    - Add scroll navigation through image slices
    - Display current slice indicator
    - Clamp slice index to valid bounds
    - _Requirements: 2.5_

  - [x] 4.8 Write property test for slice navigation bounds
    - **Property 8: Slice Navigation Bounds**
    - **Validates: Requirements 2.5**
    - Tests included in measurement.property.test.js

  - [x] 4.9 Create metadata display overlay
    - Show patient name, study date, modality, institution
    - Position overlay in standard DICOM corners
    - _Requirements: 2.6_

  - [x] 4.10 Create series thumbnail navigator
    - Display thumbnails for multi-series studies
    - Allow series selection
    - _Requirements: 2.7_

- [x] 5. Checkpoint - DICOM viewer core complete
  - All viewer tests pass (19/19 in measurement.property.test.js)

- [x] 6. Implement measurement and annotation tools
  - [x] 6.1 Create measurement service with distance calculation
    - Implement calculateDistance function using pixel spacing
    - Return distance in mm with proper precision
    - _Requirements: 3.1_

  - [x] 6.2 Write property test for distance measurement accuracy
    - **Property 10: Distance Measurement Accuracy**
    - **Validates: Requirements 3.1**
    - Tests in measurement.property.test.js

  - [x] 6.3 Implement angle measurement tool
    - Calculate angle from three points
    - Display angle in degrees
    - _Requirements: 3.2_

  - [x] 6.4 Write property test for angle measurement accuracy
    - **Property 11: Angle Measurement Accuracy**
    - **Validates: Requirements 3.2**
    - Tests in measurement.property.test.js

  - [x] 6.5 Implement ROI tools for area measurement
    - Create rectangle and ellipse ROI tools
    - Calculate area using pixel spacing
    - Display mean density (HU) for CT images
    - _Requirements: 3.3_

  - [x] 6.6 Write property test for area measurement accuracy
    - **Property 12: Area Measurement Accuracy**
    - **Validates: Requirements 3.3**
    - Tests in measurement.property.test.js

  - [x] 6.7 Create text annotation tool with arrow pointers
    - Allow adding text labels to images
    - Include arrow pointer functionality
    - _Requirements: 3.4_
    - Implemented in MeasurementTools.js

  - [x] 6.8 Create annotation storage service
    - Save annotations linked to image and doctor
    - Implement show/hide functionality
    - _Requirements: 3.5, 3.6_
    - Created annotationStorageService.js

  - [x] 6.9 Write property test for annotation persistence
    - **Property 4: Study-Patient-Visit Linking Integrity**
    - **Validates: Requirements 1.5, 3.5, 10.3**
    - 12 tests pass in annotation.property.test.js

  - [x] 6.10 Implement image export with annotations
    - Export images as PNG/JPEG with annotations burned in
    - _Requirements: 3.7_
    - Created ImageExport.js component

- [x] 7. Implement multi-panel comparison view
  - [x] 7.1 Create MultiPanelViewer component
    - Support 2x1, 1x2, and 2x2 layouts
    - Allow independent image loading per panel
    - _Requirements: 4.1_

  - [x] 7.2 Implement panel synchronization
    - Sync zoom, pan, window/level across panels when enabled
    - Sync slice navigation for CT/MRI
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 7.3 Write property test for panel synchronization
    - **Property 14: Panel Synchronization**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - 13 tests pass in panelSync.property.test.js

  - [x] 7.4 Create imaging history selector
    - Display patient's imaging history with dates and modalities
    - Allow selection for comparison
    - _Requirements: 4.5_

  - [x] 7.5 Write property test for imaging history retrieval
    - **Property 15: Imaging History Retrieval**
    - **Validates: Requirements 4.5**
    - Tests included in panelSync.property.test.js

- [x] 8. Checkpoint - DICOM viewer complete
  - All DICOM tests pass (measurement, annotation, panelSync)

- [x] 9. Enhance telemedicine with EMR integration
  - [x] 9.1 Create TelemedicineConsultation component extending VideoConsultation
    - Add EMR sidebar with patient summary
    - Include connection quality indicator
    - _Requirements: 5.4, 6.1_
    - Created TelemedicineConsultation.js with full EMR integration

  - [x] 9.2 Implement media toggle controls
    - Enhance existing mute/unmute functionality
    - Track toggle state changes
    - _Requirements: 5.3_

  - [x] 9.3 Write property test for media toggle state
    - **Property 16: Media Toggle State**
    - **Validates: Requirements 5.3**
    - Tests in telemedicine.property.test.js

  - [x] 9.4 Implement connection quality calculation
    - Calculate quality from WebRTC stats (packet loss, jitter, RTT)
    - Display quality indicator
    - _Requirements: 5.4_

  - [x] 9.5 Write property test for connection quality calculation
    - **Property 17: Connection Quality Calculation**
    - **Validates: Requirements 5.4**
    - Tests in telemedicine.property.test.js

  - [x] 9.6 Create EMR sidebar component
    - Display patient vitals, labs, medical history
    - Allow creating prescriptions with interaction checking
    - Allow recording notes and ordering labs
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
    - Integrated in TelemedicineConsultation.js

  - [x] 9.7 Write property test for EMR integration
    - **Property 19: EMR Integration During Consultation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
    - EMR actions logging tested in telemedicine.property.test.js

  - [x] 9.8 Implement session logging service
    - Log session start, end, duration, participants
    - Create EMR visit with telemedicine type
    - _Requirements: 5.6, 6.6_

  - [x] 9.9 Write property test for session logging
    - **Property 18: Session Logging Completeness**
    - **Validates: Requirements 5.6, 6.6**
    - Tests in telemedicine.property.test.js

- [x] 10. Implement screen sharing functionality
  - [x] 10.1 Create ScreenShare component
    - Capture DICOM viewer canvas for sharing
    - Add screen track to WebRTC connection
    - _Requirements: 7.1_
    - Integrated in TelemedicineConsultation.js

  - [x] 10.2 Implement sharing indicator
    - Display "sharing" indicator to both parties
    - _Requirements: 7.2_

  - [x] 10.3 Implement real-time annotation during share
    - Allow doctor to annotate while patient views
    - _Requirements: 7.3_

  - [x] 10.4 Implement document sharing
    - Allow sharing lab reports and documents
    - _Requirements: 7.4_

  - [x] 10.5 Implement share state transitions
    - Handle start/stop sharing properly
    - Return to normal video view when stopped
    - _Requirements: 7.5_

  - [x] 10.6 Write property test for screen share state
    - **Property 20: Screen Share State Transition**
    - **Validates: Requirements 7.5**
    - Tests in telemedicine.property.test.js

- [x] 11. Checkpoint - Telemedicine enhancements complete
  - All telemedicine tests pass (21/21)

- [-] 12. Implement consultation scheduling and notifications
  - [ ] 12.1 Update appointment scheduling for telemedicine type
    - Mark appointments as video consultation type
    - _Requirements: 8.1_

  - [ ] 12.2 Write property test for appointment type marking
    - **Property 21: Appointment Type Marking**
    - **Validates: Requirements 8.1**

  - [ ] 12.3 Create notification service for telemedicine
    - Send joining instructions via email/SMS
    - Schedule reminders at 24h and 15min before
    - _Requirements: 8.2, 8.3_

  - [ ] 12.4 Write property test for notification scheduling
    - **Property 22: Notification Scheduling**
    - **Validates: Requirements 8.2, 8.3**

  - [ ] 12.5 Implement patient identity verification
    - Verify patient identity before connecting
    - _Requirements: 8.5_

  - [ ] 12.6 Write property test for identity verification
    - **Property 23: Identity Verification Requirement**
    - **Validates: Requirements 8.5**

- [ ] 13. Implement consultation recording
  - [ ] 13.1 Create recording consent service
    - Track consent from both doctor and patient
    - Require both consents before recording
    - _Requirements: 9.1_

  - [ ] 13.2 Write property test for recording consent
    - **Property 24: Recording Consent Requirement**
    - **Validates: Requirements 9.1**

  - [ ] 13.3 Implement recording indicator
    - Display visible recording indicator to all participants
    - _Requirements: 9.2_

  - [ ] 13.4 Create recording storage service
    - Store recordings linked to visit record
    - Apply encryption and retention policies
    - _Requirements: 9.3, 9.5_

  - [ ] 13.5 Write property test for recording-visit linking
    - **Property 25: Recording-Visit Linking**
    - **Validates: Requirements 9.3**

  - [ ] 13.6 Implement recording access control
    - Verify permissions before allowing access
    - Log all access attempts
    - _Requirements: 9.4_

  - [ ] 13.7 Write property test for recording access control
    - **Property 26: Recording Access Control**
    - **Validates: Requirements 9.4**

- [ ] 14. Implement imaging reports
  - [ ] 14.1 Create ImagingReport component with structured template
    - Include findings, impression, recommendations sections
    - Auto-populate patient and study info from DICOM
    - _Requirements: 10.1, 10.2_

  - [ ] 14.2 Write property test for report structure
    - **Property 27: Report Structure Completeness**
    - **Validates: Requirements 10.1**

  - [ ] 14.3 Create report storage service
    - Link reports to study and patient timeline
    - Support draft, preliminary, final status
    - _Requirements: 10.3_

  - [ ] 14.4 Write property test for report-study association
    - **Property 28: Report-Study Association**
    - **Validates: Requirements 10.4**

  - [ ] 14.5 Implement PDF export with key images
    - Generate PDF with report text and embedded images
    - _Requirements: 10.5_

  - [ ] 14.6 Write property test for PDF export
    - **Property 29: PDF Export with Key Images**
    - **Validates: Requirements 10.5**

- [ ] 15. Checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Final integration and testing
  - [ ] 16.1 Integrate DICOM viewer into EMR dashboard
    - Add navigation to imaging features
    - Link from patient records
    - _Requirements: 1.5, 4.5_

  - [ ] 16.2 Integrate telemedicine enhancements
    - Replace basic VideoConsultation with enhanced version
    - Wire up EMR sidebar and screen sharing
    - _Requirements: 6.1, 7.1_

  - [ ] 16.3 Add subscription tier gating for imaging features
    - Gate DICOM features by subscription level
    - Gate recording by Advanced tier
    - _Requirements: Design subscription tier table_

  - [ ] 16.4 Write integration tests for imaging workflow
    - Test upload → view → annotate → report flow
    - Test telemedicine with EMR access
    - Verify data persistence

- [ ] 17. Final checkpoint
  - All property-based tests pass
  - All integration tests pass
  - DICOM viewer functional with measurements
  - Telemedicine enhanced with EMR integration
  - Recording with consent working
  - Advanced imaging spec implementation complete

## Notes

- All tasks include property-based tests for comprehensive coverage
- Each task references specific requirements for traceability
- Cornerstone.js requires WASM support - ensure build configuration is correct
- DICOM files can be large - implement chunked upload for files over 50MB
- Recording storage requires significant space - implement retention policies
- Backend tasks should be completed before corresponding frontend tasks
