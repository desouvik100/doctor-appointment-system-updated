# Booking Parameter Audit Report

**Date:** 2026-06-01  
**Status:** ✅ All fixes applied

---

## Root Cause Analysis

The booking flow broke because `DoctorProfileScreen` was calling `doctorService.getDoctorProfile(id)` which hits the non-existent endpoint `GET /api/doctors/:id/profile` (returns 404). The catch block silently failed, leaving `doctorData` as `null`. When a user navigated from HomeScreen (which only passed `doctorId`, not a full `doctor` object), the `doctorDetails` spread object lacked `_id` / `id`. This empty doctor propagated through the entire booking chain:

```
DoctorProfile (doctor._id = undefined)
  → AppointmentType (doctor._id = undefined)
    → SlotSelection (doctor._id = undefined)
      → handleBookingNavigation: cleanDoctorId = ""
        → Alert: "Doctor information missing."
```

**Fix:** Changed to `doctorService.getDoctorById(id)` which calls `GET /api/doctors/:id` — the correct, existing backend route.

---

## Parameter Flow Map (After Fix)

### Screen-by-Screen Parameter Contract

| Screen | Params IN | Params OUT (navigation) |
|--------|-----------|------------------------|
| **HomeScreen** | — | `{ doctor, doctorId }` → DoctorProfile |
| **BookingScreen** | — | `{ doctor, doctorId }` → DoctorProfile |
| **VideoConsultScreen** | — | `{ doctor, doctorId }` → DoctorProfile |
| **DoctorSearchScreen** | — | `{ doctor, doctorId }` → DoctorProfile |
| **DoctorsScreen** | — | `{ doctor, doctorId }` → DoctorProfile |
| **DoctorProfileScreen** | `{ doctor?, doctorId? }` | `{ doctor, doctorId, clinicId }` → AppointmentType |
| **AppointmentTypeScreen** | `{ doctor?, doctorId? }` | `{ doctor, doctorId, consultationType, clinicId }` → SlotSelection |
| **SlotSelectionScreen** | `{ doctor?, doctorId?, consultationType }` | `{ doctor, doctorId, clinicId, date, time, queueNumber, consultationType, patient, pendingBooking }` → ConfirmDetails |
| **ConfirmDetailsScreen** | `{ doctor?, doctorId?, clinicId?, date, time, ... }` | `{ doctor, doctorId, clinicId, date, time, queueNumber, consultationType, patient, pendingBooking }` → Payment |
| **PaymentScreen** | `{ doctor, doctorId?, pendingBooking, ... }` | `{ booking }` → BookingConfirmation |

### Legend
- `doctor?` — Optional; screen will fetch from API if missing but `doctorId` is present
- `doctorId` — MongoDB `_id` string, always forwarded explicitly
- `clinicId` — Extracted from `doctor.clinicId._id || doctor.clinicId`

---

## Defensive Validation Strategy

Every screen in the booking chain now implements a **3-tier safety net**:

### Tier 1: Direct prop usage
If `doctor` object arrives with full data (including `_id`), use it directly. No API call needed.

### Tier 2: Automatic fetch
If `doctor` is missing or lacks `_id`/`id`, but `doctorId` is available in route params, automatically fetch via `doctorService.getDoctorById(doctorId)`.

### Tier 3: Graceful error
If both `doctor` and `doctorId` are missing, show a "Doctor Information Missing" error screen with a "Go Back" button instead of crashing.

---

## Files Modified

| File | Change |
|------|--------|
| `DoctorProfileScreen.js` | `getDoctorProfile()` → `getDoctorById()` (API fix); pass `doctorId` + `clinicId` to AppointmentType |
| `AppointmentTypeScreen.js` | Added defensive fetch via `getDoctorById()`; loading/error UI; forward `doctorId` + `clinicId` to SlotSelection |
| `SlotSelectionScreen.js` | Added defensive fetch; replaced all `doctor?.` refs with `activeDoc?.`; forward `doctorId` + `clinicId` to ConfirmDetails |
| `ConfirmDetailsScreen.js` | Added defensive fetch; replaced all `doctor?.` refs with `activeDoc?.`; forward `doctorId` + `clinicId` to Payment |
| `HomeScreen.js` | Pass both `doctor` and `doctorId` to DoctorProfile (was only passing `doctorId`) |

---

## Entry Point Verification Matrix

| # | Entry Point | Passes `doctor`? | Passes `doctorId`? | Status |
|---|------------|:-:|:-:|:-:|
| A | HomeScreen → Recommended Doctors | ✅ | ✅ | Fixed |
| B | BookingScreen → Doctor List | ✅ | ✅ | OK |
| C | VideoConsultScreen → Consult Button | ✅ | ✅ | OK |
| D | DoctorSearchScreen → Search Results | ✅ | ✅ | OK |
| E | DoctorsScreen → Doctor List | ✅ | ✅ | OK |

---

## API Endpoint Verification

| Endpoint | Used By | Exists in Backend? |
|----------|---------|:-:|
| `GET /api/doctors/:id` | `getDoctorById()` | ✅ |
| `GET /api/doctors/:id/profile` | `getDoctorProfile()` (old) | ❌ 404 |
| `GET /api/doctors` | Search/list | ✅ |
| `POST /appointments/queue-booking` | PaymentScreen | ✅ |
| `GET /appointments/queue-info/:id/:date` | SlotSelectionScreen | ✅ |
