# 🏥 HealthSync Production Readiness Audit

This document outlines the complete Phase 1 audit of the HealthSync ecosystem (focusing on the `healthsync-pro` and `mobile` directories, along with their interaction with the `backend`). 

No code changes have been made yet, in accordance with the Phase 1 instructions.

---

## 🔴 HIGH SEVERITY ISSUES (Must Fix Before Launch)

### 1. UI Defect: Blank Doctor Cards in Doctors Search Screen
* **Issue**: The doctor cards returned in the search screen's `FlatList` `renderItem` completely omit the doctor's name, avatar, specialization, and clinic/hospital name. The layout starts directly with `statsRow`, rendering anonymous cards containing only stats and a booking button. The `cardTop` and `doctorInfo` components are defined in styles but completely missing from the JSX.
* **File Path**: [DoctorsScreen.js](file:///d:/Startup-Project/doctor-appointment-system/mobile/src/screens/doctors/DoctorsScreen.js#L219-L276)
* **Severity**: 🔴 CRITICAL (Breaks core customer booking flow)
* **Fix Recommendation**: Add the missing `cardTop` and `doctorInfo` JSX containers before the `statsRow` inside the `FlatList` `renderItem`.
* **Priority**: 1 (Immediate)

### 2. API Mismatch: Phone OTP Verification Route Mismatch (404 Error)
* **Issue**: The mobile app calls `/auth/send-otp` and `/auth/verify-otp` for phone verification. However, on the backend, these endpoints are not registered under `/api/auth` (in `authRoutes.js`). Instead, they are mounted under `/api/otp` (in `otpRoutes.js`). This results in a 404 (endpoint not found) error and completely breaks the phone OTP verification flow. Additionally, `authService.verifyOTP` maps the phone number to the backend `email` field.
* **File Path**: 
  - [authService.js](file:///d:/Startup-Project/doctor-appointment-system/mobile/src/services/api/authService.js#L104-L107) (lines 104, 128)
  - [OTPVerificationScreen.js](file:///d:/Startup-Project/doctor-appointment-system/mobile/src/screens/auth/OTPVerificationScreen.js#L132) (line 132)
* **Severity**: 🔴 CRITICAL (Breaks user login & OTP verification)
* **Fix Recommendation**: Update the API client endpoints in `authService.js` to call `/otp/send-otp` and `/otp/verify-otp` respectively, and ensure the parameters are mapped correctly.
* **Priority**: 1 (Immediate)

### 3. Payment Integration: Hardcoded Outdated Backend URL
* **Issue**: The `BACKEND_URL` in `paymentService.js` is hardcoded as `'https://healthsync-backend.onrender.com'`. However, the actual cloud backend runs on `'https://doctor-appointment-system-updated.onrender.com'`. Any call to `openPaymentPage()` using this service will load a 404 or non-existent domain in the web browser instead of opening the checkout page on the correct backend.
* **File Path**: [paymentService.js](file:///d:/Startup-Project/doctor-appointment-system/mobile/src/services/paymentService.js#L10) (line 10)
* **Severity**: 🔴 HIGH (Breaks payment redirects in mobile checkouts)
* **Fix Recommendation**: Resolve the backend URL dynamically from the central configuration `mobile/src/config/env.js` (which holds the correct production URL) instead of using a hardcoded string.
* **Priority**: 1 (Immediate)

### 4. Database Integrity: Payment Status Inconsistency
* **Issue**: When an appointment is created in the database before the checkout flow, it is saved with `status: 'pending'` instead of `status: 'pending_payment'`. If a user abandons the payment screen, the slot remains locked under a general pending state, causing double-bookings and queue configuration issues.
* **File Path**: 
  - [appointmentRoutes.js](file:///d:/Startup-Project/doctor-appointment-system/backend/routes/appointmentRoutes.js)
  - [paymentRoutes.js](file:///d:/Startup-Project/doctor-appointment-system/backend/routes/paymentRoutes.js)
* **Severity**: 🔴 HIGH (Slot leakage & queue inconsistency)
* **Fix Recommendation**: Change the initial status of unpaid appointments to `'pending_payment'` with `paymentStatus: 'pending'`. Implement/ensure a background scheduler task that auto-cancels uncompleted `'pending_payment'` appointments after 15 minutes to release slots.
* **Priority**: 1 (Immediate)

---

## 🟡 MEDIUM SEVERITY ISSUES (Should Fix Before Launch)

### 1. Security: Insufficient Rate Limiting on OTP Endpoints
* **Issue**: The global rate limiter is configured at 300 requests/min per IP. This allows automated bots to spam email and SMS OTP endpoints, incurring significant API cost spikes (Twilio/Msg91/Gmail API limits) and enabling OTP brute-forcing.
* **File Path**: [server.js](file:///d:/Startup-Project/doctor-appointment-system/backend/server.js#L53-L80) (lines 53-80)
* **Severity**: 🟡 MEDIUM (Financial / security risk)
* **Fix Recommendation**: Implement a strict rate-limiter middleware specifically on `/api/otp/send-otp`, `/api/auth/send-registration-otp`, and other verification endpoints, limiting attempts to 5 requests per 10 minutes per IP/identifier.
* **Priority**: 2

### 2. Payment Integration: Non-Automated Refunds
* **Issue**: While a cancellation endpoint exists, automated refund processing via Razorpay APIs on successful patient cancellation is not fully integrated. This requires admins to manually verify cancellations and process refunds on the Razorpay dashboard.
* **File Path**: 
  - [refundRoutes.js](file:///d:/Startup-Project/doctor-appointment-system/backend/routes/refundRoutes.js)
  - [appointmentRoutes.js](file:///d:/Startup-Project/doctor-appointment-system/backend/routes/appointmentRoutes.js)
* **Severity**: 🟡 MEDIUM (Operational overhead)
* **Fix Recommendation**: Integrate automatic refund processing via Razorpay API inside the cancellation controller/handler for paid appointments.
* **Priority**: 2

---

## 🟢 LOW SEVERITY ISSUES (Nice to Have)

### 1. UX Improvement: WebView-based Payment Checkout vs Native SDK
* **Issue**: The mobile app loads Razorpay in a WebView wrapper (`react-native-webview`) pointing to a backend-rendered HTML page. This is slower, does not support native OS UPI application intents smoothly, and degrades the premium feel of the app.
* **File Path**: [RazorpayPaymentScreen.js](file:///d:/Startup-Project/doctor-appointment-system/mobile/src/screens/booking/RazorpayPaymentScreen.js)
* **Severity**: 🟢 LOW (UX improvement)
* **Fix Recommendation**: Integrate the official `react-native-razorpay` library to trigger the native Android/iOS payment sheet for a superior UX.
* **Priority**: 3
