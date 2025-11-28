# Payment Mode Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                     │
├─────────────────────────────────────────────────────────────┤
│  Backend: USE_STRIPE_PAYMENTS=false                         │
│  Frontend: REACT_APP_USE_STRIPE_PAYMENTS=false              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PAYMENT MODE DECISION                      │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │  TEST MODE   │        │ PRODUCTION   │
        │  (false)     │        │    (true)    │
        └──────────────┘        └──────────────┘
```

---

## Appointment Booking Flow

### TEST MODE (USE_STRIPE_PAYMENTS=false)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BOOKS APPOINTMENT                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              POST /api/appointments                          │
│  • Creates appointment                                       │
│  • paymentStatus: 'not_required'                            │
│  • status: 'confirmed'                                       │
│  • requiresPayment: false                                    │
│  • testMode: true                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND RESPONSE                          │
│  • Skips PaymentGateway component                           │
│  • Shows success toast                                       │
│  • "Test Mode - No Payment Required"                        │
│  • Closes booking modal                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ✅ APPOINTMENT CONFIRMED                    │
│  • Immediately available                                     │
│  • No payment needed                                         │
│  • Ready for consultation                                    │
└─────────────────────────────────────────────────────────────┘
```

### PRODUCTION MODE (USE_STRIPE_PAYMENTS=true)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BOOKS APPOINTMENT                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              POST /api/appointments                          │
│  • Creates appointment                                       │
│  • paymentStatus: 'pending'                                 │
│  • status: 'pending'                                         │
│  • requiresPayment: true                                     │
│  • testMode: false                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND RESPONSE                          │
│  • Shows PaymentGateway component                           │
│  • Displays payment breakdown                                │
│  • Shows Stripe payment form                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/payments/create-payment-intent            │
│  • Creates Stripe PaymentIntent                             │
│  • Returns clientSecret                                      │
│  • Links to appointment                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER PAYS WITH STRIPE                     │
│  • Enters card details                                       │
│  • Stripe processes payment                                  │
│  • Payment confirmed                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              POST /api/payments/confirm                      │
│  • Updates appointment                                       │
│  • paymentStatus: 'completed'                               │
│  • status: 'confirmed'                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ✅ APPOINTMENT CONFIRMED                    │
│  • Payment successful                                        │
│  • Ready for consultation                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Flow

### Frontend Components

```
BookAppointment.js
       │
       ├─ Checks: REACT_APP_USE_STRIPE_PAYMENTS
       │
       ├─ TEST MODE
       │  └─> Direct success
       │      └─> onSuccess()
       │          └─> Close modal
       │
       └─ PRODUCTION MODE
          └─> Show PaymentGateway
              │
              └─> PaymentGateway.js
                  │
                  ├─ Checks: testMode from API
                  │
                  ├─ TEST MODE
                  │  └─> Auto-confirm
                  │      └─> onPaymentSuccess()
                  │
                  └─ PRODUCTION MODE
                     └─> Show StripePayment
                         │
                         └─> StripePayment.js
                             │
                             └─> Stripe payment form
                                 └─> Process payment
                                     └─> onPaymentSuccess()
```

---

## Backend Service Flow

### Payment Service

```
paymentService.js
       │
       ├─ Constructor
       │  └─> Checks: USE_STRIPE_PAYMENTS
       │      ├─ true: Initialize Stripe
       │      └─> false: Skip Stripe
       │
       ├─ createPaymentIntent()
       │  ├─ TEST MODE: Return { testMode: true }
       │  └─> PRODUCTION: Create Stripe PaymentIntent
       │
       ├─ confirmPayment()
       │  ├─ TEST MODE: Return { testMode: true }
       │  └─> PRODUCTION: Confirm with Stripe
       │
       └─ processRefund()
          ├─ TEST MODE: Just cancel appointment
          └─> PRODUCTION: Process Stripe refund
```

---

## API Endpoint Behavior

```
┌──────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/appointments                                       │
│  ├─ TEST MODE                                                │
│  │  └─> { status: 'confirmed', paymentStatus: 'not_required' }│
│  └─ PRODUCTION                                               │
│     └─> { status: 'pending', paymentStatus: 'pending' }      │
│                                                               │
│  POST /api/payments/create-payment-intent                    │
│  ├─ TEST MODE                                                │
│  │  └─> { testMode: true, message: '...' }                  │
│  └─ PRODUCTION                                               │
│     └─> { clientSecret: '...', paymentIntentId: '...' }     │
│                                                               │
│  GET /api/payments/config                                    │
│  ├─ TEST MODE                                                │
│  │  └─> { testMode: true, paymentsEnabled: false }          │
│  └─ PRODUCTION                                               │
│     └─> { testMode: false, paymentsEnabled: true, key: '...' }│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Database State

### Appointment Document

```javascript
// TEST MODE
{
  _id: "...",
  userId: "...",
  doctorId: "...",
  status: "confirmed",           // ✅ Auto-confirmed
  paymentStatus: "not_required", // ✅ No payment needed
  paymentIntentId: null,         // ✅ No Stripe ID
  payment: {
    consultationFee: 500,
    gst: 110,
    platformFee: 35,
    totalAmount: 645,
    paymentStatus: "not_required"
  }
}

// PRODUCTION MODE (Before Payment)
{
  _id: "...",
  userId: "...",
  doctorId: "...",
  status: "pending",             // ⏳ Awaiting payment
  paymentStatus: "pending",      // ⏳ Awaiting payment
  paymentIntentId: "pi_...",     // 🔗 Stripe ID
  payment: {
    consultationFee: 500,
    gst: 110,
    platformFee: 35,
    totalAmount: 645,
    paymentStatus: "pending"
  }
}

// PRODUCTION MODE (After Payment)
{
  _id: "...",
  userId: "...",
  doctorId: "...",
  status: "confirmed",           // ✅ Payment confirmed
  paymentStatus: "completed",    // ✅ Payment successful
  paymentIntentId: "pi_...",     // 🔗 Stripe ID
  paymentDetails: {
    paymentIntentId: "pi_...",
    amount: 645,
    currency: "inr",
    paidAt: "2025-11-27T..."
  },
  payment: {
    consultationFee: 500,
    gst: 110,
    platformFee: 35,
    totalAmount: 645,
    paymentStatus: "completed"
  }
}
```

---

## Configuration Files

```
Project Root
│
├── backend/
│   ├── .env
│   │   └── USE_STRIPE_PAYMENTS=false
│   │
│   ├── config/
│   │   └── paymentConfig.js
│   │       └── Exports USE_STRIPE_PAYMENTS
│   │
│   ├── services/
│   │   └── paymentService.js
│   │       └── Uses USE_STRIPE_PAYMENTS
│   │
│   └── routes/
│       ├── appointmentRoutes.js
│       │   └── Uses USE_STRIPE_PAYMENTS
│       └── paymentRoutes.js
│           └── Uses USE_STRIPE_PAYMENTS
│
└── frontend/
    ├── .env
    │   └── REACT_APP_USE_STRIPE_PAYMENTS=false
    │
    └── src/
        └── components/
            ├── BookAppointment.js
            │   └── Uses REACT_APP_USE_STRIPE_PAYMENTS
            ├── PaymentGateway.js
            │   └── Uses REACT_APP_USE_STRIPE_PAYMENTS
            └── StripePayment.js
                └── Uses REACT_APP_USE_STRIPE_PAYMENTS
```

---

## Decision Tree

```
                    Start Booking
                         │
                         ▼
              Check USE_STRIPE_PAYMENTS
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
    false (TEST)                    true (PROD)
         │                               │
         ▼                               ▼
  Create Appointment              Create Appointment
  status: confirmed               status: pending
  payment: not_required           payment: pending
         │                               │
         ▼                               ▼
  Show Success Toast              Show Payment Gateway
  Close Modal                            │
         │                               ▼
         ▼                        User Pays with Stripe
    ✅ DONE                               │
                                         ▼
                                  Update Appointment
                                  status: confirmed
                                  payment: completed
                                         │
                                         ▼
                                  Show Success Toast
                                  Close Modal
                                         │
                                         ▼
                                    ✅ DONE
```

---

## Summary

### Test Mode (Default)
- ✅ No Stripe initialization
- ✅ No payment processing
- ✅ Appointments auto-confirmed
- ✅ Fast and simple

### Production Mode
- ✅ Stripe fully integrated
- ✅ Real payment processing
- ✅ Appointments confirmed after payment
- ✅ Professional and secure

---

**Switch anytime by changing environment variables and restarting servers!**
