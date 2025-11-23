# Stripe Payment Integration Setup Guide

## Overview
This doctor appointment system now includes real Stripe payment integration for secure, production-ready payment processing.

## Features
- ✅ Real Stripe payment processing
- ✅ Secure card payments with 3D Secure support
- ✅ Automatic payment confirmation
- ✅ Refund processing
- ✅ Payment history tracking
- ✅ Webhook support for real-time updates
- ✅ PCI DSS compliant
- ✅ Support for all major cards and digital wallets

## Setup Instructions

### 1. Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification

### 2. Get API Keys
1. Login to Stripe Dashboard
2. Go to **Developers** → **API Keys**
3. Copy your keys:
   - **Publishable Key** (starts with `pk_test_` for test mode)
   - **Secret Key** (starts with `sk_test_` for test mode)

### 3. Configure Backend Environment
Update `backend/.env` with your real Stripe keys:

```env
# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Payment Configuration
CURRENCY=inr
PLATFORM_FEE_PERCENTAGE=7
GST_PERCENTAGE=22
```

### 4. Configure Frontend Environment
Update `frontend/.env` with your publishable key:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here

# Payment Configuration
REACT_APP_GST_PERCENTAGE=22
REACT_APP_PLATFORM_FEE_PERCENTAGE=7
REACT_APP_CURRENCY=INR
```

### 5. Setup Webhooks (Optional but Recommended)
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
5. Copy the webhook signing secret to your `.env` file

### 6. Test Payment Flow
1. Use Stripe test card numbers:
   - **Success**: `4242424242424242`
   - **Decline**: `4000000000000002`
   - **3D Secure**: `4000002500003155`
2. Use any future expiry date and any 3-digit CVC

### 7. Production Deployment
1. Switch to live API keys (start with `pk_live_` and `sk_live_`)
2. Update webhook endpoint to production URL
3. Enable live mode in Stripe Dashboard
4. Test with real card (small amount)

## Payment Flow

### 1. User Books Appointment
- User selects doctor and fills appointment details
- System calculates total amount (consultation + GST + platform fee)

### 2. Payment Processing
- Stripe Payment Intent is created
- User enters card details in secure Stripe form
- Payment is processed with 3D Secure if required
- Confirmation is sent to backend via webhook

### 3. Appointment Confirmation
- Payment success triggers appointment confirmation
- User receives confirmation
- Doctor gets notification

### 4. Payment History
- All payments are tracked in user's payment history
- Refunds can be processed if needed

## Security Features

### Frontend Security
- Stripe Elements for secure card input
- No card data touches your servers
- PCI DSS compliance handled by Stripe
- Client-side validation

### Backend Security
- Webhook signature verification
- Payment intent validation
- Secure API key handling
- Encrypted data storage

## Supported Payment Methods
- Credit Cards (Visa, MasterCard, American Express)
- Debit Cards
- Digital Wallets (Apple Pay, Google Pay)
- Bank Transfers (via Stripe)
- UPI (for Indian customers)

## Error Handling
- Network failures
- Card declines
- Insufficient funds
- 3D Secure failures
- Webhook failures

## Monitoring & Analytics
- Real-time payment tracking in Stripe Dashboard
- Revenue analytics
- Failed payment analysis
- Refund tracking

## Support
- Stripe provides 24/7 support for payment issues
- Comprehensive documentation at [https://stripe.com/docs](https://stripe.com/docs)
- Test mode for safe development

## Cost Structure
- Stripe charges 2.9% + ₹2 per successful transaction in India
- No setup fees or monthly fees
- Transparent pricing with no hidden costs

## Compliance
- PCI DSS Level 1 certified
- GDPR compliant
- SOC 1 and SOC 2 Type II certified
- Supports Strong Customer Authentication (SCA)

---

**Note**: Always test thoroughly in Stripe's test mode before going live. Never commit real API keys to version control.