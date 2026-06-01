# HealthSync Doctor Profile V2 Production-Grade Audit

**Role:** Principal Healthcare Product Designer & Architect (Practo, Apollo 24/7, Mayo Clinic Digital, & Google Health Joint Task Force)  
**Date:** 2026-06-01  
**Status:** 🔍 Pre-Implementation Production Design Audit Complete

---

## 1. Executive Critique: Truth-First Healthcare Design

A core problem in modern health-tech startups is the temptation to fabricate metrics to artificially drive bookings. However, in professional clinical contexts (Mayo Clinic, Google Health), **trust and data integrity** are the primary drivers of patient booking conversions. 

Fabricating success metrics (e.g. "99% Success Rate") or patient volumes without backend backing is a regulatory risk and a violation of clinical design standards.

### V2 Strategic Principles:
1. **Never Fabricate Statistics:** Any metrics not returned by the backend database will be hidden or represented by clean "data pending verification" placeholders.
2. **Double-Checked Verification Badges:** We will display verification credentials (✓ Verified Doctor, ✓ Verified Credentials, ✓ Verified Clinic) only when the doctor's provider verification status is confirmed.
3. **Structured Contextual Value Cards:** We will convert generic biography lists into Material 3 structured cards (Professional Summary, Specializations, Conditions Treated, Education, Certifications, Hospital Affiliations).
4. **Availability Immediacy:** The booking conversion bar and the **Availability Section** (Next Available Slot) will become the highest priority components on the profile, letting users schedule care in seconds.

---

## 2. Dynamic Component State Rules (Backend Verification)

To enforce clinical accuracy, we establish the following layout state rules based on database data availability:

| UI Section | If Backend Data Exists | If Backend Data is Missing |
| :--- | :--- | :--- |
| **Response / Success Metrics** | Render metrics cleanly. | **Hide section completely** to avoid artificial stats. |
| **Intro Video & Clinic Photos** | Render carousel / player wrapper. | **Hide container layout**; consume zero screen height. |
| **Next Available Slot** | Display exact time (e.g., `Today, 3:30 PM`). | Display fallback: `Check slot availability calendar`. |
| **Review Helpful 👍 Action** | Keep button interactive (requires API integration). | **Render button as disabled** with a subtle tooltip: *"Sign in / Verification pending."* |
| **Clinic Distance & Map** | Render map preview, distance in km. | Hide map container and distance chip. |

---

## 3. Flagship V2 Layout Order

```
┌──────────────────────────────────────────────┐
│  [Back Button]      [Title]      [Favorite]  │
├──────────────────────────────────────────────┤
│  1. Profile Header Redesign                  │
│     - Name, Specialty, Experience, Rating    │
│     - ✓ Verified Doctor/Clinic/Credentials   │
├──────────────────────────────────────────────┤
│  2. Consultation Modes (🏥 / 🎥 / 🏠)        │
│     - Mode tags, active availability status  │
├──────────────────────────────────────────────┤
│  3. Next Available Slot Timeline             │
│     - Today / Tomorrow / Wednesday slots     │
├──────────────────────────────────────────────┤
│  4. Trust Section (Highlights Grid)          │
│     - Fee, Languages, Clinics, Type list     │
├──────────────────────────────────────────────┤
│  5. About Tab / Cards (Progressive)          │
│     - Summary, Conditions, Certifications    │
│     - Affiliations & Education               │
├──────────────────────────────────────────────┤
│  6. Clinic Information (Map Context)         │
│     - Clinic name, open status, distance     │
├──────────────────────────────────────────────┤
│  7. Patient Reviews                          │
│     - Verified Patient Badges, Visit Type    │
│     - Helpful 👍 (disabled/placeholder)      │
├──────────────────────────────────────────────┤
│  8. Bottom Sticky Conversion Footer          │
│     - Fee, Next slot time, [ Book CTA ]      │
└──────────────────────────────────────────────┘
```

---

## 4. UI/UX Design System Specifications

* **Verification Badges:** Styled using HSL curated success teal (`#00D4AA`) and deep green (`#10B981`) text with mini validation ticks.
* **Consultation Mode Tags:** Bold, horizontal Material 3 chip layout showing support statuses:
  - `🏥 In-Clinic Visit`: Available
  - `🎥 Video Consultation`: Available Now
  - `🏠 Home Visit`: Not Supported (or hidden)
* **Mini Availability Timeline:** Horizontal list of dates (Today, Tomorrow, Day After) with quick-select slot capsules, showing immediate availability.
* **Reanimated 3 Motion Spec:**
  - Tab swaps will use layout transitions (`layout={Layout.springify()}`) and timing opacity fades (`withTiming`) to prevent layouts from snapping.
  - Button presses use spring damping (`0.96` scale) to resemble native iOS/Android system components.
  - Image loadings fade in smoothly upon network completion.
* **Remove:** Instagram-style reply threads, local counter incrementing placeholders, and fake patient treatment counters.
