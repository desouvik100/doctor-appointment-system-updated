# Stripe Test Mode Configuration Guide

## Overview
This guide explains how to enable/disable Stripe payments in the Doctor Appointment System. The system now supports two modes:
- **Production Mode**: Real Stripe payments required
- **Test Mode**: Free appointments without payment (for testing/development)

---

## Quick Start

### Enable Test Mode (No Payments)
1. **Backend**: Set in `backend/.env`
   ```env
   USE_STRIPE_PAYMENTS=false
   ```

2. **Frontend**: Set in `frontend/.env`
   ```env
   REACT_APP_USE_STRIPE_PAYMENTS=false
   ```

3. **Restart both servers**
   ```bash
   # Stop servers if running
   # Then restart:
   npm start
   ```

### Enable Production Mode (Real Payments)
1. **Backend**: Set in `backend/.env`
   ```env
   USE_STRIPE_PAYMENTS=true
   ```

2. **Frontend**: Set in `frontend/.env`
   ```env
   REACT_APP_USE_STRIPE_PAYMENTS=true
   ```

3. **Restart both servers**

---

## What Changes in Test Mode?

### Backend Changes
✅ **Appointments**:
- Created with `paymentStatus: 'not_required'`
- Automatically set to `status: 'confirmed'`
- No Stripe API calls made
- Payment breakdown still calculated (for display only)

✅ **Payment Routes**:
- `/api/payments/create-payment-intent` returns test mode response
- `/api/payments/confirm` returns test mode response
- `/api/payments/config` returns `testMode: true, paymentsEnabled: false`
- No Stripe initialization if payments disabled

✅ **Refunds**:
- Simply cancel appointment without Stripe refund
- No payment to refund in test mode

### Frontend Changes
✅ **Booking Flow**:
- Shows "Test Mode" alert instead of payment required
- Skips payment gateway entirely
- Shows success toast: "Appointment booked successfully (Test Mode - No Payment Required)"
- Appointment immediately confirmed

✅ **Payment Components**:
- `PaymentGateway` auto-confirms and closes
- `StripePayment` shows test mode message
- No Stripe.js loaded in test mode

---

## Environment Variables

### Backend (`backend/.env`)
```env
# Payment Mode Configuration
USE_STRIPE_PAYMENTS=false  # Set to 'true' for real payments

# Stripe Keys (only used when USE_STRIPE_PAYMENTS=true)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payment Configuration
CURRENCY=inr
PLATFORM_FEE_PERCENTAGE=7
GST_PERCENTAGE=22
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5005
REACT_APP_USE_STRIPE_PAYMENTS=false  # Set to 'true' for real payments
```

---

## Testing the System

### Test Mode Verification
1. **Book an Appointment**:
   - Select doctor, date, time
   - Click "Book Appointment"
   - Should see: "Test Mode - No payment required"
   - Appointment immediately confirmed

2. **Check Appointment Status**:
   - Status: `confirmed`
   - Payment Status: `not_required`
   - No `paymentIntentId`

3. **Admin Dashboard**:
   - Appointments show as confirmed
   - Payment status shows "Not Required" or "Test"

### Production Mode Verification
1. **Book an Appointment**:
   - Select doctor, date, time
   - Click "Book Appointment"
   - Redirected to Stripe payment page
   - Complete payment
   - Appointment confirmed after payment

2. **Check Appointment Status**:
   - Status: `pending` → `confirmed` (after payment)
   - Payment Status: `pending` → `completed`
   - Has `paymentIntentId`

---

## Database Schema Updates

### Appointment Model
Added new payment status value:
```javascript
paymentStatus: {
  type: String,
  enum: ["pending", "completed", "failed", "refunded", "not_required"],
  default: "pending"
}
```

**Payment Status Values**:
- `pending`: Payment not yet completed (production mode)
- `completed`: Payment successful (production mode)
- `failed`: Payment failed (production mode)
- `refunded`: Payment refunded (production mode)
- `not_required`: Test mode - no payment needed

---

## API Response Changes

### POST `/api/appointments`
**Test Mode Response**:
```json
{
  "_id": "...",
  "status": "confirmed",
  "paymentStatus": "not_required",
  "requiresPayment": false,
  "testMode": true,
  "paymentBreakdown": {
    "consultationFee": 500,
    "gst": 110,
    "platformFee": 35,
    "totalAmount": 645
  }
}
```

**Production Mode Response**:
```json
{
  "_id": "...",
  "status": "pending",
  "paymentStatus": "pending",
  "requiresPayment": true,
  "testMode": false,
  "paymentBreakdown": {
    "consultationFee": 500,
    "gst": 110,
    "platformFee": 35,
    "totalAmount": 645
  }
}
```

### POST `/api/payments/create-payment-intent`
**Test Mode Response**:
```json
{
  "success": true,
  "testMode": true,
  "message": "Stripe disabled - running in test mode (no payment required)",
  "appointmentId": "..."
}
```

**Production Mode Response**:
```json
{
  "success": true,
  "clientSecret": "pi_...",
  "paymentIntentId": "pi_...",
  "amount": 645,
  "breakdown": {...}
}
```

---

## Code Architecture

### Backend Files Modified
1. **`backend/config/paymentConfig.js`** (NEW)
   - Central payment configuration
   - Exports `USE_STRIPE_PAYMENTS` flag

2. **`backend/services/paymentService.js`**
   - Conditional Stripe initialization
   - Test mode handling in all methods

3. **`backend/routes/appointmentRoutes.js`**
   - Test mode appointment creation
   - Auto-confirm in test mode

4. **`backend/routes/paymentRoutes.js`**
   - Test mode responses for all endpoints

5. **`backend/models/Appointment.js`**
   - Added `not_required` payment status

### Frontend Files Modified
1. **`frontend/src/components/BookAppointment.js`**
   - Test mode detection
   - Skip payment flow in test mode
   - Updated success messages

2. **`frontend/src/components/PaymentGateway.js`**
   - Auto-confirm in test mode
   - Skip Stripe UI

3. **`frontend/src/components/StripePayment.js`**
   - Test mode detection
   - Conditional Stripe loading

---

## Troubleshooting

### Issue: Appointments still require payment in test mode
**Solution**: 
- Check both `.env` files have `USE_STRIPE_PAYMENTS=false`
- Restart both backend and frontend servers
- Clear browser cache

### Issue: Stripe errors in test mode
**Solution**:
- Stripe should not be called in test mode
- Check console logs for "Stripe payments DISABLED"
- Verify `USE_STRIPE_PAYMENTS=false` in backend

### Issue: Frontend still shows payment UI
**Solution**:
- Check `REACT_APP_USE_STRIPE_PAYMENTS=false` in `frontend/.env`
- Restart frontend server (React needs restart for env changes)
- Check browser console for test mode logs

### Issue: Database shows wrong payment status
**Solution**:
- Old appointments may have old status
- New appointments should have `not_required` status
- Can manually update: `db.appointments.updateMany({}, {$set: {paymentStatus: 'not_required'}})`

---

## Security Notes

⚠️ **Important**:
- Test mode should ONLY be used in development/testing
- Never deploy to production with `USE_STRIPE_PAYMENTS=false`
- Keep Stripe keys secure even when not in use
- Test mode appointments are real database entries

---

## Switching Between Modes

### Development → Production
1. Set `USE_STRIPE_PAYMENTS=true` in both `.env` files
2. Verify Stripe keys are valid
3. Test with Stripe test cards first
4. Deploy with production Stripe keys

### Production → Development
1. Set `USE_STRIPE_PAYMENTS=false` in both `.env` files
2. Restart servers
3. Test appointment booking
4. Verify no Stripe calls in logs

---

## Summary

✅ **Test Mode Benefits**:
- No Stripe account needed for testing
- Faster development workflow
- Test full appointment flow without payments
- No payment processing delays

✅ **Production Mode Benefits**:
- Real payment processing
- Secure Stripe integration
- Payment tracking and refunds
- Professional payment experience

---

## Support

For issues or questions:
1. Check console logs (backend and frontend)
2. Verify environment variables
3. Restart servers after changes
4. Check this guide for common issues

---

**Last Updated**: November 27, 2025
**Version**: 1.0
