# Requirements Document

## Introduction

Systematic History is a clinical-grade feature that transforms HealthSync from a simple booking platform into a professional medical workflow tool. It enables structured symptom collection system-by-system (General, Respiratory, Cardiovascular, etc.) before or during appointment booking, providing doctors with organized patient history summaries and enabling AI-powered doctor matching based on symptoms.

## Glossary

- **Systematic History**: A structured medical history collection method that checks symptoms system-by-system (body systems) rather than random questions
- **Body System**: A functional grouping of organs (e.g., Respiratory, Cardiovascular, Gastrointestinal)
- **Symptom Chip**: A toggleable UI element representing a specific symptom
- **Severity Slider**: A visual control for indicating symptom intensity (1-5 scale)
- **SOAP Notes**: Subjective, Objective, Assessment, Plan - standard medical documentation format
- **EMR**: Electronic Medical Record
- **AI Doctor Matcher**: Algorithm that recommends appropriate specialists based on symptom patterns

## Requirements

### Requirement 1

**User Story:** As a patient, I want to provide my symptoms in a structured step-by-step flow, so that I don't miss important health information and the doctor receives organized data.

#### Acceptance Criteria

1. WHEN a patient initiates symptom collection THEN the System SHALL display a step-by-step card-based flow with progress indicator
2. WHEN a patient completes a body system section THEN the System SHALL automatically advance to the next section with smooth animation
3. WHEN a patient selects symptoms THEN the System SHALL use toggle chips with Yes/No options for each symptom
4. WHEN a symptom is selected THEN the System SHALL prompt for duration (1-3 days, 1 week, >1 week) and severity (1-5 scale)
5. IF a patient skips a section THEN the System SHALL mark it as "No symptoms reported" and allow continuation

### Requirement 2

**User Story:** As a patient, I want to report symptoms across all major body systems, so that doctors can identify potential issues I might not have considered.

#### Acceptance Criteria

1. WHEN displaying symptom categories THEN the System SHALL include: General, Respiratory, Cardiovascular, Gastrointestinal, Genitourinary, Neurological, Musculoskeletal, Skin, and Endocrine systems
2. WHEN displaying General symptoms THEN the System SHALL include: fever, weight loss, fatigue, weakness, appetite changes
3. WHEN displaying Respiratory symptoms THEN the System SHALL include: cough, breathlessness, wheezing, chest tightness, sputum
4. WHEN displaying Cardiovascular symptoms THEN the System SHALL include: chest pain, palpitations, swelling, dizziness
5. WHEN displaying Gastrointestinal symptoms THEN the System SHALL include: nausea, vomiting, abdominal pain, diarrhea, constipation, bloating
6. WHEN displaying Neurological symptoms THEN the System SHALL include: headache, dizziness, numbness, tingling, vision changes, memory issues

### Requirement 3

**User Story:** As a patient, I want to provide my past medical history and current medications, so that the doctor has complete context for my consultation.

#### Acceptance Criteria

1. WHEN collecting past history THEN the System SHALL provide searchable/selectable options for common conditions (Diabetes, Hypertension, Asthma, Heart Disease, Thyroid disorders)
2. WHEN collecting medications THEN the System SHALL allow free-text entry with auto-suggestions for common medicines
3. WHEN collecting allergies THEN the System SHALL provide a dedicated section with drug and food allergy options
4. WHEN a patient has previous systematic history records THEN the System SHALL pre-fill past history and medications from the last submission
5. WHEN displaying the form THEN the System SHALL include optional file upload for previous reports/prescriptions

### Requirement 4

**User Story:** As a doctor, I want to see a clean structured summary of patient symptoms, so that I can quickly understand the patient's condition and save consultation time.

#### Acceptance Criteria

1. WHEN a doctor views an appointment THEN the System SHALL display a formatted Systematic History Summary card
2. WHEN displaying the summary THEN the System SHALL group symptoms by body system with checkmarks for affected systems
3. WHEN displaying symptom details THEN the System SHALL show duration and severity for each reported symptom
4. WHEN no symptoms are reported for a system THEN the System SHALL display "No" or a dash indicator
5. WHEN displaying the summary THEN the System SHALL highlight past history and current medications prominently

### Requirement 5

**User Story:** As a patient, I want the app to recommend appropriate doctors based on my symptoms, so that I book with the right specialist.

#### Acceptance Criteria

1. WHEN a patient completes systematic history THEN the System SHALL analyze symptoms and suggest relevant specializations
2. WHEN symptoms indicate respiratory issues (cough, breathlessness) THEN the System SHALL recommend General Physician or Pulmonologist
3. WHEN symptoms indicate joint/muscle issues THEN the System SHALL recommend Orthopedic or Rheumatologist
4. WHEN symptoms indicate cardiac issues THEN the System SHALL recommend Cardiologist
5. WHEN symptoms indicate neurological issues THEN the System SHALL recommend Neurologist
6. WHEN multiple systems are affected THEN the System SHALL recommend General Physician as primary option

### Requirement 6

**User Story:** As a patient, I want my systematic history to be saved and reusable, so that I don't have to re-enter the same information for future appointments.

#### Acceptance Criteria

1. WHEN a patient submits systematic history THEN the System SHALL store it linked to the appointment and user profile
2. WHEN a patient books a new appointment THEN the System SHALL offer to use previous history or create new
3. WHEN displaying previous history THEN the System SHALL show the date it was last updated
4. WHEN a patient edits previous history THEN the System SHALL create a new version while preserving the original
5. WHEN storing history THEN the System SHALL use a structured JSON format for easy retrieval and display

### Requirement 7

**User Story:** As a clinic administrator, I want systematic history data to integrate with our workflow, so that reception staff can prepare for patient visits.

#### Acceptance Criteria

1. WHEN a patient completes systematic history THEN the System SHALL make it visible in the clinic dashboard
2. WHEN displaying in clinic view THEN the System SHALL show a condensed summary with expandable details
3. WHEN a receptionist views the queue THEN the System SHALL indicate which patients have completed systematic history
4. WHEN exporting appointment data THEN the System SHALL include systematic history in a printable format

### Requirement 8

**User Story:** As a system administrator, I want the systematic history feature to be mobile-optimized, so that patients can easily complete it on their phones.

#### Acceptance Criteria

1. WHEN displaying on mobile THEN the System SHALL use large touch targets (minimum 48px) for all interactive elements
2. WHEN displaying symptom chips THEN the System SHALL use horizontal scrolling for overflow items
3. WHEN displaying severity slider THEN the System SHALL use a thumb-friendly slider with haptic feedback
4. WHEN the form is partially completed THEN the System SHALL auto-save progress locally
5. WHEN network is unavailable THEN the System SHALL queue submission and sync when connection restores
