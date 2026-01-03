# WhatsApp Business API Setup Guide

This guide explains how to set up WhatsApp Business API for HealthSync to send appointment notifications, reminders, and OTPs.

## Prerequisites

1. A Facebook Business Account
2. A phone number that can receive SMS/calls for verification
3. A Meta Developer Account

## Step 1: Create Meta Business App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** type
4. Fill in app details:
   - App Name: `HealthSync WhatsApp`
   - Contact Email: Your email
5. Click **Create App**

## Step 2: Add WhatsApp Product

1. In your app dashboard, click **Add Product**
2. Find **WhatsApp** and click **Set Up**
3. You'll be redirected to WhatsApp setup

## Step 3: Get API Credentials

### From WhatsApp > API Setup:

1. **Phone Number ID**: Copy from the "From" section
2. **WhatsApp Business Account ID**: Copy from the top of the page
3. **Temporary Access Token**: Click "Generate" (valid for 24 hours)

### For Permanent Access Token:

1. Go to **Business Settings** → **System Users**
2. Create a new System User with Admin role
3. Add the WhatsApp app to the system user
4. Generate a permanent token with these permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`

## Step 4: Configure Webhook

1. In WhatsApp > Configuration, click **Edit** on Webhook
2. Set Callback URL: `https://your-backend-url.com/api/whatsapp/webhook`
3. Set Verify Token: `healthsync_whatsapp_verify`
4. Subscribe to these fields:
   - `messages`
   - `message_template_status_update`

## Step 5: Add Phone Number

### Option A: Use Test Number (Development)
- Meta provides a test phone number for development
- Can only send to numbers added as test recipients

### Option B: Add Business Phone Number (Production)
1. Go to WhatsApp > Phone Numbers
2. Click **Add Phone Number**
3. Verify via SMS or voice call
4. Complete business verification

## Step 6: Update Environment Variables

Add to your `backend/.env`:

```env
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=1234567890123456
WHATSAPP_VERIFY_TOKEN=healthsync_whatsapp_verify
```

## Step 7: Create Message Templates (Optional)

For business-initiated messages (outside 24-hour window), you need approved templates:

1. Go to WhatsApp > Message Templates
2. Click **Create Template**
3. Example templates:

### Appointment Confirmation Template
- Name: `appointment_confirmation`
- Category: `UTILITY`
- Language: `en`
- Body:
```
Hello {{1}}! Your appointment with Dr. {{2}} is confirmed for {{3}} at {{4}}. Booking ID: {{5}}
```

### Appointment Reminder Template
- Name: `appointment_reminder`
- Category: `UTILITY`
- Body:
```
Reminder: Your appointment with Dr. {{1}} is in {{2}} hours on {{3}}. Please arrive 15 minutes early.
```

## Testing

### Check Configuration Status
```bash
curl https://your-backend-url.com/api/whatsapp/status
```

### Send Test Message
```bash
curl -X POST https://your-backend-url.com/api/whatsapp/send-test \
  -H "Content-Type: application/json" \
  -d '{"phone": "919876543210", "message": "Test from HealthSync!"}'
```

## Features Implemented

| Feature | Endpoint/Function |
|---------|-------------------|
| Appointment Confirmation | `sendAppointmentConfirmation()` |
| Appointment Reminder | `sendAppointmentReminder()` |
| Cancellation Notice | `sendAppointmentCancellation()` |
| Prescription Ready | `sendPrescriptionReady()` |
| OTP Verification | `sendOTP()` |
| Payment Confirmation | `sendPaymentConfirmation()` |
| Google Meet Link | `sendMeetLink()` |
| Auto-Reply Bot | Webhook handler |

## Pricing

WhatsApp Business API pricing (as of 2024):
- **User-initiated conversations**: Free for first 1,000/month
- **Business-initiated (Utility)**: ~₹0.35 per message
- **Business-initiated (Marketing)**: ~₹0.80 per message

## Troubleshooting

### Message Not Delivered
- Check phone number format (must include country code: 919876543210)
- Verify the recipient has WhatsApp
- Check if within 24-hour messaging window

### Webhook Not Working
- Verify the callback URL is publicly accessible
- Check verify token matches
- Ensure HTTPS is enabled

### Access Token Expired
- Generate a new permanent token from System Users
- Update the `WHATSAPP_ACCESS_TOKEN` in .env

## Support

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Business Help Center](https://www.facebook.com/business/help)
