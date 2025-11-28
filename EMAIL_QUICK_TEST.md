# Email Service - Quick Test

## What Was Fixed
Updated email service to use **Nodemailer with Gmail** for reliable email delivery instead of Resend API.

## Test Email Delivery Now

### Step 1: Start Backend
```bash
cd backend
npm start
```

**Expected Output:**
```
✅ Email transporter ready
✅ Server running on port 5005
```

### Step 2: Send Test OTP
Use any REST client or curl:

```bash
curl -X POST http://localhost:5005/api/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","type":"registration"}'
```

### Step 3: Check Response
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

### Step 4: Check Backend Console
```
✅ Email sent successfully
📧 Message ID: <message-id>
📧 To: your-email@gmail.com
📧 Subject: HealthSync - Verify Your Registration
```

### Step 5: Check Your Email
- Open your email inbox
- Look for email from `desouvik0000@gmail.com`
- Subject: "HealthSync - Verify Your Registration"
- Contains 6-digit OTP code

## Email Features

✅ **OTP Registration**
- 6-digit code
- 10-minute expiration
- Professional template

✅ **Password Reset**
- Reset token
- 1-hour expiration
- Secure link

✅ **Appointment Confirmation**
- Appointment details
- Google Meet link
- Doctor/Patient info

## Current Configuration

**Email Provider:** Gmail
**Status:** ✅ Active and Ready
**Credentials:** Configured in backend/.env

## Troubleshooting

### Email Not Received?
1. Check spam/junk folder
2. Verify email address is correct
3. Check backend console for errors
4. Restart backend: `npm start`

### Check Backend Logs
Look for:
```
✅ Email sent successfully
📧 Message ID: ...
```

If you see errors, check:
- EMAIL_USER in .env
- EMAIL_PASS in .env
- Gmail account is accessible
- 2-factor authentication (if enabled)

## Next Steps

1. Test OTP email delivery
2. Test password reset email
3. Test appointment confirmation
4. Verify all emails are received

---

**Status:** ✅ Ready to Use
**Email Provider:** Gmail via Nodemailer
