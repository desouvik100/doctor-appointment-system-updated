# Design Document

## Overview

The Clinic EMR Subscription Module transforms HealthSync into a sellable B2B healthcare software product. Clinics subscribe for 6 months or 1 year to access EMR screens based on their plan tier (Basic, Standard, Advanced). The system operates independently of patient booking, supporting walk-in patients and providing a professional clinical interface suitable for daily hospital use.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Clinic EMR Module                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Basic     │  │  Standard   │  │  Advanced   │              │
│  │   Screens   │  │   Screens   │  │   Screens   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │  Access Control Layer │                          │
│              │  (Subscription Check) │                          │
│              └───────────┬───────────┘                          │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │   Role-Based Access   │                          │
│              │  (Doctor/Staff/Admin) │                          │
│              └───────────┬───────────┘                          │
│                          ▼                                       │
├─────────────────────────────────────────────────────────────────┤
│                    Existing HealthSync                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Patients │  │ Doctors  │  │ Clinics  │  │Appointments│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. EMR Subscription Model

```javascript
// backend/models/EMRSubscription.js
{
  clinicId: ObjectId,           // Reference to Clinic
  plan: 'basic' | 'standard' | 'advanced',
  duration: '6_months' | '1_year',
  startDate: Date,
  expiryDate: Date,
  status: 'active' | 'expired' | 'cancelled',
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    amount: Number,
    currency: String
  },
  autoRenew: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. EMR Screen Registry

```javascript
// backend/config/emrScreens.js
const EMR_SCREENS = {
  // Basic Plan Screens
  PATIENT_REGISTRATION: { id: 'patient_registration', plan: 'basic', roles: ['admin', 'staff', 'doctor'] },
  VISIT_HISTORY: { id: 'visit_history', plan: 'basic', roles: ['admin', 'staff', 'doctor'] },
  SYSTEMATIC_HISTORY: { id: 'systematic_history', plan: 'basic', roles: ['admin', 'doctor'] },
  BASIC_PRESCRIPTION: { id: 'basic_prescription', plan: 'basic', roles: ['doctor'] },
  UPLOADED_REPORTS: { id: 'uploaded_reports', plan: 'basic', roles: ['admin', 'staff', 'doctor'] },
  
  // Standard Plan Screens
  DOCTOR_NOTES: { id: 'doctor_notes', plan: 'standard', roles: ['doctor'] },
  FOLLOW_UP_SCHEDULING: { id: 'follow_up_scheduling', plan: 'standard', roles: ['admin', 'staff', 'doctor'] },
  MEDICATION_HISTORY: { id: 'medication_history', plan: 'standard', roles: ['doctor'] },
  PATIENT_TIMELINE: { id: 'patient_timeline', plan: 'standard', roles: ['admin', 'doctor'] },
  
  // Advanced Plan Screens
  EMR_DASHBOARD: { id: 'emr_dashboard', plan: 'advanced', roles: ['admin'] },
  ANALYTICS_REPORTS: { id: 'analytics_reports', plan: 'advanced', roles: ['admin'] },
  AUDIT_LOGS: { id: 'audit_logs', plan: 'advanced', roles: ['admin'] },
  STAFF_MANAGEMENT: { id: 'staff_management', plan: 'advanced', roles: ['admin'] },
  DATA_EXPORT: { id: 'data_export', plan: 'advanced', roles: ['admin'] }
};

const PLAN_HIERARCHY = {
  basic: 1,
  standard: 2,
  advanced: 3
};
```

### 3. Walk-in Patient Model

```javascript
// Extension to existing Patient/User model
{
  // Existing fields...
  registrationType: 'online' | 'walk_in',
  registeredByClinic: ObjectId,
  registeredByStaff: ObjectId,
  isVerified: Boolean,  // false for walk-ins until phone verified
  clinicPatientId: String  // Clinic's internal patient ID
}
```

### 4. EMR Visit Record Model

```javascript
// backend/models/EMRVisit.js
{
  patientId: ObjectId,
  clinicId: ObjectId,
  doctorId: ObjectId,
  visitDate: Date,
  visitType: 'walk_in' | 'appointment' | 'follow_up',
  appointmentId: ObjectId,  // null for walk-ins
  
  // Clinical Data
  chiefComplaint: String,
  systematicHistory: ObjectId,  // Reference to SystematicHistory
  vitalSigns: {
    bloodPressure: String,
    pulse: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    spo2: Number
  },
  
  // Doctor's Documentation
  clinicalNotes: String,
  diagnosis: [{
    code: String,  // ICD-10 code
    description: String,
    type: 'primary' | 'secondary'
  }],
  
  prescription: ObjectId,  // Reference to Prescription
  labOrders: [String],
  followUpDate: Date,
  
  // Audit
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Clinic Staff Model

```javascript
// backend/models/ClinicStaff.js
{
  clinicId: ObjectId,
  userId: ObjectId,  // Reference to User
  name: String,
  email: String,
  phone: String,
  role: 'admin' | 'doctor' | 'staff',
  permissions: [String],  // Screen IDs they can access
  isActive: Boolean,
  invitedBy: ObjectId,
  joinedAt: Date
}
```

## Data Models

### Subscription Plans Configuration

```javascript
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Clinic EMR',
    description: 'Essential patient management',
    features: [
      'Patient Registration',
      'Visit History',
      'Systematic History',
      'Basic Prescription',
      'Report Viewing'
    ],
    pricing: {
      '6_months': { amount: 4999, currency: 'INR' },
      '1_year': { amount: 8999, currency: 'INR' }
    },
    maxDoctors: 2,
    maxStaff: 3
  },
  standard: {
    name: 'Standard Clinic EMR',
    description: 'Complete clinical documentation',
    features: [
      'All Basic features',
      'Doctor Notes & Diagnosis',
      'Follow-up Scheduling',
      'Medication History',
      'Patient Timeline'
    ],
    pricing: {
      '6_months': { amount: 9999, currency: 'INR' },
      '1_year': { amount: 17999, currency: 'INR' }
    },
    maxDoctors: 5,
    maxStaff: 10
  },
  advanced: {
    name: 'Advanced Clinic EMR',
    description: 'Full EMR with analytics',
    features: [
      'All Standard features',
      'EMR Dashboard',
      'Analytics & Reports',
      'Audit Logs',
      'Multi-staff Management',
      'PDF Export'
    ],
    pricing: {
      '6_months': { amount: 19999, currency: 'INR' },
      '1_year': { amount: 35999, currency: 'INR' }
    },
    maxDoctors: 'unlimited',
    maxStaff: 'unlimited'
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Subscription Access Control
*For any* EMR screen access attempt, if the clinic's subscription plan level is lower than the screen's required plan level, access SHALL be denied and a locked screen displayed.
**Validates: Requirements 2.1, 2.2**

### Property 2: Plan Hierarchy Inclusion
*For any* subscription plan, all screens from lower-tier plans SHALL be accessible (Basic ⊂ Standard ⊂ Advanced).
**Validates: Requirements 3.1, 4.1, 5.1**

### Property 3: Role-Screen Restriction
*For any* user accessing EMR, the visible screens SHALL be the intersection of their role permissions and their clinic's subscription permissions.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 4: Subscription Expiry Enforcement
*For any* clinic with expired subscription, EMR screen access SHALL be restricted while patient data remains preserved in read-only mode.
**Validates: Requirements 1.4, 10.1**

### Property 5: Walk-in Patient Integration
*For any* walk-in patient registered through EMR, a valid patient record SHALL be created that is usable across all EMR screens and linkable to future visits.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 6: Audit Trail Completeness
*For any* data modification in Advanced plan EMR, an audit log entry SHALL be created containing user, timestamp, and change details.
**Validates: Requirements 5.4**

## Error Handling

1. **Subscription Expired**: Show graceful locked screen with renewal CTA, preserve data access in read-only
2. **Role Mismatch**: Redirect to appropriate dashboard based on role
3. **Payment Failed**: Allow retry, don't activate subscription until payment confirmed
4. **Network Offline**: Cache critical patient data locally, sync when online

## Testing Strategy

### Unit Tests
- Subscription plan validation
- Screen access permission checks
- Role-based filtering
- Expiry date calculations

### Property-Based Tests (fast-check)
- Access control matrix validation
- Plan hierarchy inclusion
- Role-screen intersection
- Audit log generation

### Integration Tests
- Subscription purchase flow
- Walk-in patient registration
- EMR screen navigation
- Data export functionality

## UI Components

### 1. EMR Navigation Sidebar
```
┌─────────────────────┐
│ 🏥 Clinic EMR       │
│ ─────────────────── │
│ 📋 Patient Reg.     │
│ 📅 Visit History    │
│ 🩺 Systematic Hx    │
│ 💊 Prescription     │
│ 📄 Reports          │
│ ─────────────────── │
│ 🔒 Doctor Notes     │ ← Locked (upgrade)
│ 🔒 Follow-ups       │
│ ─────────────────── │
│ ⚙️ Settings         │
│ ─────────────────── │
│ Plan: Basic         │
│ Expires: 45 days    │
└─────────────────────┘
```

### 2. Locked Screen Component
```
┌─────────────────────────────────────┐
│                                     │
│         🔒 Feature Locked           │
│                                     │
│   Doctor Notes & Diagnosis          │
│   requires Standard plan            │
│                                     │
│   ┌─────────────────────────────┐   │
│   │    Upgrade to Standard      │   │
│   │    ₹9,999 / 6 months        │   │
│   └─────────────────────────────┘   │
│                                     │
│   Compare Plans →                   │
│                                     │
└─────────────────────────────────────┘
```

### 3. Subscription Status Badge
```
┌──────────────────────────┐
│ EMR: Standard Plan       │
│ ✓ Active • 127 days left │
└──────────────────────────┘
```
