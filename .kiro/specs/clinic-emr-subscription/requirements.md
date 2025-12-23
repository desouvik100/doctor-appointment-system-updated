# Requirements Document

## Introduction

This document specifies the requirements for a clinic-focused Electronic Medical Records (EMR) subscription module for HealthSync. The EMR system transforms HealthSync from a booking app into a sellable healthcare software product that clinics can subscribe to for 6 months or 1 year. The system provides screen-based access control where clinics get access to predefined features based on their subscription plan.

## Glossary

- **EMR**: Electronic Medical Records - digital version of patient charts
- **Clinic**: A healthcare facility that subscribes to the EMR system
- **Screen**: A distinct functional page/module in the EMR system
- **Subscription Plan**: A tiered access level (Basic, Standard, Advanced)
- **Walk-in Patient**: A patient who visits without prior online booking
- **Staff**: Non-doctor clinic employees (receptionists, nurses)
- **Audit Log**: Record of who accessed/modified what data and when

## Requirements

### Requirement 1: Subscription Plan Management

**User Story:** As a clinic administrator, I want to subscribe to an EMR plan, so that my clinic can access digital medical records features.

#### Acceptance Criteria

1. WHEN a clinic administrator selects a subscription plan THEN the system SHALL display three plan options: Basic Clinic EMR, Standard Clinic EMR, and Advanced Clinic EMR
2. WHEN a clinic administrator chooses a plan duration THEN the system SHALL offer 6-month and 1-year subscription options with appropriate pricing
3. WHEN a subscription is purchased THEN the system SHALL activate the corresponding screen access permissions immediately
4. WHEN a subscription expires THEN the system SHALL automatically restrict access to EMR screens while preserving stored data
5. WHEN a clinic has an active subscription THEN the system SHALL display subscription validity (days remaining) prominently in the dashboard

### Requirement 2: Screen-Based Access Control

**User Story:** As a system administrator, I want to control EMR screen access based on subscription level, so that clinics only access features they've paid for.

#### Acceptance Criteria

1. WHEN a user attempts to access an EMR screen THEN the system SHALL verify the clinic's subscription includes that screen
2. WHEN a clinic without permission accesses a restricted screen THEN the system SHALL display a locked screen with upgrade call-to-action
3. WHEN defining EMR screens THEN the system SHALL tag each screen with a required plan level (basic, standard, advanced)
4. WHEN a subscription is downgraded THEN the system SHALL restrict access to higher-tier screens while preserving data

### Requirement 3: Basic Clinic EMR Screens

**User Story:** As a clinic with Basic EMR subscription, I want access to essential patient management screens, so that I can digitize basic clinic operations.

#### Acceptance Criteria

1. WHEN a Basic plan clinic accesses EMR THEN the system SHALL provide a Patient Registration screen for walk-in and online patients
2. WHEN a Basic plan clinic accesses EMR THEN the system SHALL provide an Appointment & Visit History screen showing all patient visits
3. WHEN a Basic plan clinic accesses EMR THEN the system SHALL provide a Systematic History screen for structured symptom collection
4. WHEN a Basic plan clinic accesses EMR THEN the system SHALL provide a Basic Prescription screen for creating prescriptions
5. WHEN a Basic plan clinic accesses EMR THEN the system SHALL provide an Uploaded Reports view for viewing patient documents

### Requirement 4: Standard Clinic EMR Screens

**User Story:** As a clinic with Standard EMR subscription, I want access to enhanced clinical documentation screens, so that doctors can maintain comprehensive patient records.

#### Acceptance Criteria

1. WHEN a Standard plan clinic accesses EMR THEN the system SHALL provide all Basic plan screens
2. WHEN a Standard plan clinic accesses EMR THEN the system SHALL provide a Doctor Notes & Diagnosis screen for clinical documentation
3. WHEN a Standard plan clinic accesses EMR THEN the system SHALL provide a Follow-up Scheduling screen for managing return visits
4. WHEN a Standard plan clinic accesses EMR THEN the system SHALL provide a Medication History screen showing all prescribed medicines
5. WHEN a Standard plan clinic accesses EMR THEN the system SHALL provide a Patient Timeline view showing chronological health events

### Requirement 5: Advanced Clinic EMR Screens

**User Story:** As a clinic with Advanced EMR subscription, I want access to analytics and administrative screens, so that I can optimize clinic operations.

#### Acceptance Criteria

1. WHEN an Advanced plan clinic accesses EMR THEN the system SHALL provide all Standard plan screens
2. WHEN an Advanced plan clinic accesses EMR THEN the system SHALL provide a Full EMR Dashboard with key metrics
3. WHEN an Advanced plan clinic accesses EMR THEN the system SHALL provide an Analytics & Reports screen with clinic statistics
4. WHEN an Advanced plan clinic accesses EMR THEN the system SHALL provide Audit Logs showing who edited what and when
5. WHEN an Advanced plan clinic accesses EMR THEN the system SHALL provide Multi-doctor & Staff access control management
6. WHEN an Advanced plan clinic accesses EMR THEN the system SHALL provide Data Export functionality in PDF format

### Requirement 6: Role-Based Access Within Clinic

**User Story:** As a clinic administrator, I want to assign different access levels to doctors and staff, so that each role sees only relevant screens.

#### Acceptance Criteria

1. WHEN a doctor logs into EMR THEN the system SHALL display only clinical screens (patient records, prescriptions, notes)
2. WHEN a staff member logs into EMR THEN the system SHALL display only administrative screens (registration, appointments)
3. WHEN a clinic admin logs into EMR THEN the system SHALL display subscription management, billing, and all permitted screens
4. WHEN assigning roles THEN the system SHALL enforce role restrictions regardless of subscription level

### Requirement 7: Walk-in Patient Support

**User Story:** As a clinic receptionist, I want to register walk-in patients without online booking, so that the EMR works for all patients.

#### Acceptance Criteria

1. WHEN a walk-in patient arrives THEN the system SHALL allow registration without requiring prior online booking
2. WHEN registering a walk-in patient THEN the system SHALL capture name, phone, age, gender, and basic details
3. WHEN a walk-in patient is registered THEN the system SHALL create a patient record usable across all EMR screens
4. WHEN a walk-in patient has existing records THEN the system SHALL link new visits to their history

### Requirement 8: Clinical User Interface

**User Story:** As a clinic user, I want a professional clinical interface, so that the EMR feels like real hospital software.

#### Acceptance Criteria

1. WHEN displaying EMR screens THEN the system SHALL use a clean, clinical UI design without ads or competitor listings
2. WHEN displaying EMR screens THEN the system SHALL show "EMR powered by HealthSync" subtly in the footer
3. WHEN designing for clinics THEN the system SHALL optimize layouts for Android tablets and desktop screens
4. WHEN displaying patient data THEN the system SHALL use medical-standard formatting and terminology

### Requirement 9: Subscription Billing Integration

**User Story:** As a clinic administrator, I want to pay for EMR subscription through the app, so that I can manage billing conveniently.

#### Acceptance Criteria

1. WHEN a clinic subscribes THEN the system SHALL process payment through Razorpay
2. WHEN a subscription is about to expire THEN the system SHALL send reminder notifications 30, 7, and 1 day before expiry
3. WHEN viewing subscription status THEN the system SHALL display current plan, expiry date, and renewal options
4. WHEN renewing subscription THEN the system SHALL offer seamless renewal without data loss

### Requirement 10: Data Persistence and Export

**User Story:** As a clinic administrator, I want patient data to persist even after subscription expires, so that we don't lose medical records.

#### Acceptance Criteria

1. WHEN a subscription expires THEN the system SHALL preserve all patient data in read-only mode
2. WHEN an Advanced plan clinic exports data THEN the system SHALL generate PDF reports of patient records
3. WHEN exporting data THEN the system SHALL include visit history, prescriptions, and clinical notes
4. WHEN a subscription is renewed THEN the system SHALL restore full access to preserved data
