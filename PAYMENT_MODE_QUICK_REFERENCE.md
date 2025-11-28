# Payment Mode Quick Reference Card

## 🚀 Quick Toggle

### Disable Payments (Test Mode)
```bash
# Backend: backend/.env
USE_STRIPE_PAYMENTS=false

# Frontend: frontend/.env
REACT_APP_USE_STRIPE_PAYMENTS=false

# Restart servers
```

### Enable Payments (Production Mode)
```bash
# Backend: backend/.env
USE_STRIPE_PAYMENTS=true

# Frontend: frontend/.env
REACT_APP_USE_STRIPE_PAYMENTS=true

# Restart servers
```

---

## 📋 Test Mode Checklist

✅ **What Works in Test Mode:**
- ✓ Book appointments (all types)
- ✓ Online consultations
- ✓ In-person appointments
- ✓ Appointment management
- ✓ Admin dashboard
- ✓ Doctor dashboard
- ✓ Patient dashboard
- ✓ Cancel appointments

❌ **What's Disabled in Test Mode:**
- ✗ Stripe payment processing
- ✗ Payment intent creation
- ✗ Card payments
- ✗ Payment webhooks
- ✗ Refund processing (just cancels)

---

## 🔍 How to Verify Mode

### Backend Console
```
✅ Stripe payments ENABLED    (Production)
⚠️  Stripe payments DISABLED  (Test Mode)
```

### Frontend Booking
```
Test Mode: Shows green alert "No payment required"
Production: Shows blue alert "Payment Required"
```

### API Response
```javascript
// Test Mode
{
  "testMode": true,
  "requiresPayment": false,
  "paymentStatus": "not_required"
}

// Production Mode
{
  "testMode": false,
  "requiresPayment": true,
  "paymentStatus": "pending"
}
```

---

## 🧪 Testing Commands

### Test Payment Configuration
```bash
node test-payment-mode.js
```

### Check Backend Logs
```bash
# Look for:
"✅ Stripe payments ENABLED" or
"⚠️  Stripe payments DISABLED"
```

### Test Appointment Booking
1. Go to patient dashboard
2. Click "Book Appointment"
3. Select doctor, date, time
4. Click "Book Appointment"
5. **Test Mode**: Immediate success, no payment
6. **Production**: Redirected to payment page

---

## 🗄️ Database Fields

### Appointment Payment Status Values

| Value | Mode | Description |
|-------|------|-------------|
| `not_required` | Test | No payment needed |
| `pending` | Production | Awaiting payment |
| `completed` | Production | Payment successful |
| `failed` | Production | Payment failed |
| `refunded` | Production | Payment refunded |

### Appointment Status Values

| Value | Mode | Description |
|-------|------|-------------|
| `confirmed` | Test | Auto-confirmed (no payment) |
| `pending` | Production | Awaiting payment |
| `confirmed` | Production | Payment completed |
| `in_progress` | Both | Consultation ongoing |
| `completed` | Both | Consultation finished |
| `cancelled` | Both | Appointment cancelled |

---

## 🚨 Common Issues

### Issue: Still asking for payment in test mode
**Fix**: 
```bash
# 1. Check .env files
cat backend/.env | grep USE_STRIPE
cat frontend/.env | grep REACT_APP_USE_STRIPE

# 2. Restart servers
# Stop both servers, then start again
```

### Issue: Stripe errors in console
**Fix**: 
```bash
# Backend should show:
"⚠️  Stripe payments DISABLED - Running in test mode"

# If not, check USE_STRIPE_PAYMENTS=false in backend/.env
```

### Issue: Frontend shows payment UI
**Fix**:
```bash
# 1. Check frontend/.env
REACT_APP_USE_STRIPE_PAYMENTS=false

# 2. Restart frontend (React needs restart for env changes)
# 3. Clear browser cache (Ctrl+Shift+R)
```

---

## 📊 API Endpoints Behavior

### POST `/api/appointments`
| Mode | Response |
|------|----------|
| Test | `requiresPayment: false`, `status: confirmed` |
| Production | `requiresPayment: true`, `status: pending` |

### POST `/api/payments/create-payment-intent`
| Mode | Response |
|------|----------|
| Test | `{ testMode: true, message: "..." }` |
| Production | `{ clientSecret: "...", paymentIntentId: "..." }` |

### GET `/api/payments/config`
| Mode | Response |
|------|----------|
| Test | `{ testMode: true, paymentsEnabled: false }` |
| Production | `{ testMode: false, paymentsEnabled: true, publishableKey: "..." }` |

---

## 💡 Pro Tips

1. **Development**: Always use test mode
2. **Staging**: Test with Stripe test mode enabled
3. **Production**: Enable real payments
4. **Demo**: Use test mode for client demos
5. **Testing**: Use test mode for automated tests

---

## 🔐 Security Notes

⚠️ **Never commit `.env` files to git**
⚠️ **Test mode should not be used in production**
⚠️ **Keep Stripe keys secure**
⚠️ **Test mode appointments are real database entries**

---

## 📞 Quick Support

**Check logs**: Look for payment mode messages in console
**Test script**: Run `node test-payment-mode.js`
**Documentation**: See `STRIPE_TEST_MODE_GUIDE.md` for details

---

**Last Updated**: November 27, 2025
