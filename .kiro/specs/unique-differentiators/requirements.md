# Requirements Document

## Introduction

This document outlines unique differentiating features for HealthSyncPro that address gaps in existing healthcare platforms (Practo, Lybrate, 1mg, etc.). The focus is on Tier-2/3 India markets, doctor-friendly economics, and solving real pain points that competitors ignore.

## Glossary

- **HealthSyncPro**: The healthcare appointment and management platform
- **Tier-2/3 Cities**: Non-metro Indian cities like Bankura, Asansol, Durgapur, Siliguri
- **Queue Token System**: Physical clinic queue management digitized
- **Doctor-First Economics**: Commission structure favoring doctors over platform

---

## Market Gap Analysis

### What Competitors Do WRONG:

1. **Practo/Lybrate** - High commission (15-25%), metro-focused, ignore small clinics
2. **1mg** - Medicine-first, appointments are secondary
3. **All of them** - No WhatsApp integration, no regional language, no offline support

### Your UNFAIR Advantages:

1. **Hyper-local focus** - Own Bankura/Bengal first, then expand
2. **Doctor-friendly pricing** - 10% online, ₹25 flat clinic (vs 20%+ competitors)
3. **WhatsApp-native** - India runs on WhatsApp, not apps
4. **Offline-first** - Works in low connectivity areas
5. **Regional language** - Bengali, Hindi UI (competitors are English-only)

---

## Requirements

### Requirement 1: WhatsApp-First Booking System

**User Story:** As a patient in a Tier-2 city, I want to book appointments via WhatsApp, so that I don't need to download another app or have good internet.

#### Acceptance Criteria

1. WHEN a patient sends "book" to the WhatsApp number THEN the system SHALL respond with available doctors and time slots
2. WHEN a patient selects a doctor via WhatsApp THEN the system SHALL create a booking and send confirmation
3. WHEN an appointment is confirmed THEN the system SHALL send WhatsApp reminders 24h and 1h before
4. WHEN a doctor cancels THEN the system SHALL notify patient via WhatsApp with rebooking options
5. WHEN payment is required THEN the system SHALL send a UPI payment link via WhatsApp

### Requirement 2: Offline-First Queue Token System

**User Story:** As a clinic receptionist in a rural area, I want to manage patient queues even without internet, so that the clinic operates smoothly during connectivity issues.

#### Acceptance Criteria

1. WHEN the app loses internet connection THEN the system SHALL continue generating queue tokens locally
2. WHEN internet is restored THEN the system SHALL sync all offline tokens to the server
3. WHEN a patient arrives at clinic THEN the system SHALL generate a physical token number via SMS
4. WHEN the doctor calls next patient THEN the system SHALL send SMS notification to that patient
5. WHEN queue status changes THEN the system SHALL update the waiting room display screen

### Requirement 3: Doctor Earnings Protection (Zero-Commission Launch)

**User Story:** As a doctor in a small town, I want to try the platform without losing money to commissions, so that I can evaluate it risk-free.

#### Acceptance Criteria

1. WHEN a new doctor joins THEN the system SHALL offer first 50 appointments with zero commission
2. WHEN the doctor completes 50 appointments THEN the system SHALL apply reduced commission (₹20) for next 100
3. WHEN displaying earnings THEN the system SHALL show comparison with competitor commission rates
4. WHEN a doctor refers another doctor THEN the system SHALL extend zero-commission period by 25 appointments
5. WHEN monthly earnings exceed ₹50,000 THEN the system SHALL offer loyalty tier with reduced rates

### Requirement 4: Regional Language Support (Bengali/Hindi)

**User Story:** As a patient who doesn't speak English well, I want to use the app in my native language, so that I can understand everything clearly.

#### Acceptance Criteria

1. WHEN a user opens the app THEN the system SHALL detect device language and offer matching UI
2. WHEN Bengali is selected THEN the system SHALL display all UI elements in Bengali script
3. WHEN a doctor writes prescription THEN the system SHALL offer translation to patient's language
4. WHEN AI chatbot responds THEN the system SHALL respond in the user's selected language
5. WHEN voice input is enabled THEN the system SHALL accept Bengali/Hindi voice commands

### Requirement 5: Family Health Wallet

**User Story:** As a family head, I want to manage health expenses for my entire family in one place, so that I can track and budget healthcare costs.

#### Acceptance Criteria

1. WHEN a user adds family members THEN the system SHALL create linked health profiles
2. WHEN any family member books appointment THEN the system SHALL deduct from shared wallet
3. WHEN wallet balance is low THEN the system SHALL send notification to family head
4. WHEN monthly spending exceeds budget THEN the system SHALL alert with spending breakdown
5. WHEN tax season arrives THEN the system SHALL generate 80D medical expense report

### Requirement 6: Smart Health Reminders (Preventive Care)

**User Story:** As a patient with chronic conditions, I want automatic reminders for checkups and medicine refills, so that I don't miss important health milestones.

#### Acceptance Criteria

1. WHEN a diabetic patient hasn't had HbA1c test in 3 months THEN the system SHALL send reminder
2. WHEN prescription medicine is running low THEN the system SHALL offer one-tap refill
3. WHEN annual health checkup is due THEN the system SHALL suggest nearby health packages
4. WHEN vaccination schedule is due THEN the system SHALL notify with booking option
5. WHEN blood pressure readings show pattern THEN the system SHALL alert to consult doctor

### Requirement 7: Doctor Reputation Builder

**User Story:** As a new doctor, I want tools to build my online reputation, so that I can attract more patients without paying for ads.

#### Acceptance Criteria

1. WHEN a consultation is completed THEN the system SHALL prompt patient for review via WhatsApp
2. WHEN doctor receives 5-star review THEN the system SHALL offer to share on social media
3. WHEN doctor profile is incomplete THEN the system SHALL guide through optimization steps
4. WHEN doctor publishes health tip THEN the system SHALL distribute to relevant patients
5. WHEN doctor reaches milestone (100 patients) THEN the system SHALL award visible badge

### Requirement 8: Clinic Analytics Dashboard

**User Story:** As a clinic owner, I want insights into my practice performance, so that I can make data-driven decisions to grow.

#### Acceptance Criteria

1. WHEN viewing dashboard THEN the system SHALL show patient flow trends by day/week/month
2. WHEN analyzing revenue THEN the system SHALL break down by consultation type and payment method
3. WHEN patient no-shows occur THEN the system SHALL identify patterns and suggest solutions
4. WHEN comparing periods THEN the system SHALL show growth percentage with benchmarks
5. WHEN peak hours are identified THEN the system SHALL suggest optimal scheduling

### Requirement 9: Emergency SOS Feature

**User Story:** As a patient in medical emergency, I want one-tap access to emergency services, so that I can get help immediately.

#### Acceptance Criteria

1. WHEN SOS button is pressed THEN the system SHALL alert nearest registered ambulance
2. WHEN emergency is triggered THEN the system SHALL share live location with emergency contact
3. WHEN ambulance is dispatched THEN the system SHALL show ETA and driver details
4. WHEN patient has medical history THEN the system SHALL share critical info with responders
5. WHEN emergency is resolved THEN the system SHALL log incident for medical records

### Requirement 10: Telemedicine with Local Pharmacy Integration

**User Story:** As a patient after video consultation, I want my prescription delivered from a local pharmacy, so that I support local businesses and get medicine faster.

#### Acceptance Criteria

1. WHEN doctor writes e-prescription THEN the system SHALL send to patient's preferred local pharmacy
2. WHEN pharmacy confirms stock THEN the system SHALL show delivery time and cost
3. WHEN patient approves THEN the system SHALL process payment and initiate delivery
4. WHEN medicine is delivered THEN the system SHALL update prescription status
5. WHEN local pharmacy is unavailable THEN the system SHALL offer alternatives with comparison

---

## Business Strategy Differentiators

### 1. **"Doctor-First" Positioning**
- Marketing message: "We charge less so doctors earn more"
- Show commission comparison calculator on landing page
- Doctor testimonials from Tier-2 cities

### 2. **Hyper-Local Launch Strategy**
- Own ONE district completely (Bankura)
- Partner with local medical associations
- Sponsor local health camps
- Get district hospital on board

### 3. **WhatsApp Viral Loop**
- Every booking confirmation = shareable card
- "Refer a friend, get ₹50 wallet credit"
- Doctor can share availability on WhatsApp status

### 4. **Trust Signals for Small Towns**
- Show "X patients from [Your City] booked today"
- Local doctor photos, not stock images
- Testimonials in regional language

### 5. **Freemium for Clinics**
- Basic features FREE forever
- Premium analytics at ₹999/month
- No per-transaction fees for clinic bookings

---

## Competitive Moat Summary

| Feature | Practo | Lybrate | HealthSyncPro |
|---------|--------|---------|---------------|
| Commission | 20-25% | 15-20% | 10% / ₹25 flat |
| WhatsApp Booking | ❌ | ❌ | ✅ |
| Offline Mode | ❌ | ❌ | ✅ |
| Bengali/Hindi UI | ❌ | ❌ | ✅ |
| Family Wallet | ❌ | ❌ | ✅ |
| Local Pharmacy | ❌ | ❌ | ✅ |
| Free Tier for Doctors | ❌ | ❌ | ✅ (50 appointments) |
| Tier-2/3 Focus | ❌ | ❌ | ✅ |

---

## Priority Implementation Order

1. **Phase 1 (Now)**: WhatsApp booking, Bengali UI, Doctor referral program ✅ IMPLEMENTED
2. **Phase 2 (Month 2)**: Offline mode, Family wallet, Local pharmacy ✅ IMPLEMENTED
3. **Phase 3 (Month 3)**: Analytics dashboard, Health reminders, SOS feature ✅ IMPLEMENTED

## Implementation Status

### ✅ Completed Features:
- **WhatsApp Service** (`backend/services/whatsappService.js`) - Booking confirmations, reminders, queue updates
- **Family Health Wallet** (`backend/models/FamilyWallet.js`, `frontend/src/components/FamilyHealthWallet.js`) - Shared budget, 80D tax report
- **Doctor Referral System** (`backend/models/DoctorReferral.js`, `frontend/src/components/DoctorReferralDashboard.js`) - Zero-commission launch, tier system
- **Smart Health Reminders** (`backend/models/HealthReminder.js`, `frontend/src/components/SmartHealthReminders.js`) - Diabetes, hypertension, vaccination schedules
- **Emergency SOS** (`backend/models/EmergencySOS.js`, `frontend/src/components/EmergencySOS.js`) - One-tap emergency, live tracking
- **Offline Queue Token** (`backend/models/OfflineQueueToken.js`) - Works without internet, auto-sync
- **Regional Language Support** - Bengali and Hindi UI already implemented in i18n

### API Routes Added:
- `/api/family-wallet/*` - Family wallet management
- `/api/health-reminders/*` - Health reminder CRUD
- `/api/emergency-sos/*` - SOS trigger and tracking
- `/api/offline-queue/*` - Queue token management
- `/api/doctor-referral/*` - Doctor referral and commission

---

## Success Metrics

- **North Star**: Monthly Active Doctors in Bankura district
- **Target**: 50 doctors, 500 patients in 3 months
- **Revenue**: ₹50,000/month from commissions by Month 6
