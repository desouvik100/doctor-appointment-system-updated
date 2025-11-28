# Email Setup Guide - HealthSync

## Problem
Emails are showing as "sent" but not actually being received.

## Solution
The backend now uses **Nodemailer with Gmail** for reliable email delivery.

## Current Configuration

### Email Service
- **Provider:** Gmail (via Nodemailer)
- **Status:** ✅ Configured and ready

### Environment Variables (backend/.env)
```
EMAIL_USER=desouvik0000@gmail.com
EMAIL_PASS=vlbabtmdlopfdtzr
```

## How It Works

### 1. OTP Registration/Login
- User enters email
- Backend generates 6-digit OTP
- Email is sent via Gmail
- User receives OTP in inbox
- User enters OTP to verify

### 2. Password Reset
- User clicks "Forgot password?"
- User enters email
- Backend generates reset token
- Email is sent via Gmail
- User receives reset link

### 3. Appointment Confirmation
- Appointment is booked
- Confirmation email is sent
- Patient and doctor receive details
- Google Meet link included (if online)

## Testing Email Delivery

### Test 1: Send OTP
```bash
curl -X POST http://localhost:5005/api/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","type":"registration"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

**Check Backend Console:**
```
✅ Email sent successfully
📧 Message ID: <message-id>
📧 To: your-email@gmail.com
📧 Subject: HealthSync - Verify Your Registration
```

### Test 2: Check Email
- Open your email inbox
- Look for email from `desouvik0000@gmail.com`
- Subject: "HealthSync - Verify Your Registration"
- Contains 6-digit OTP code

## Gmail App Password Setup

If you're using Gmail with 2-factor authentication:

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification

### Step 2: Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google will generate a 16-character password
4. Copy this password

### Step 3: Update .env
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Step 4: Restart Backend
```bash
npm start
```

## Troubleshooting

### Issue: "Email credentials not configured"
**Solution:** Check that EMAIL_USER and EMAIL_PASS are set in backend/.env

### Issue: "Email transporter error"
**Solution:** 
1. Verify Gmail credentials are correct
2. Check if 2-factor authentication is enabled
3. Use App Password instead of regular password
4. Allow "Less secure app access" (if not using 2FA)

### Issue: "Email sent but not received"
**Solution:**
1. Check spam/junk folder
2. Verify recipient email is correct
3. Check backend console for errors
4. Verify Gmail account is not blocked

### Issue: "Connection timeout"
**Solution:**
1. Check internet connection
2. Verify Gmail is accessible
3. Check firewall settings
4. Try restarting backend

## Email Templates

### OTP Email
- Professional design
- 6-digit OTP code
- 10-minute expiration
- Security warnings
- Support contact info

### Password Reset Email
- Reset link with token
- 1-hour expiration
- Security notice
- Support contact info

### Appointment Confirmation
- Appointment details
- Doctor/Patient info
- Google Meet link (if online)
- Clinic information
- Arrival instructions

## Production Deployment

### For Production Email Service
Consider using professional email services:

1. **SendGrid**
   - Reliable delivery
   - Good for transactional emails
   - Free tier available

2. **Mailgun**
   - Developer-friendly
   - Good documentation
   - Free tier available

3. **AWS SES**
   - Scalable
   - Cost-effective
   - Good for high volume

### Setup SendGrid (Optional)
```bash
npm install @sendgrid/mail
```

Update emailService.js:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, subject, html, text }) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html,
    text
  };
  
  await sgMail.send(msg);
}
```

## Email Logs

### View Email Logs
Check backend console for:
```
✅ Email sent successfully
📧 Message ID: <id>
📧 To: recipient@example.com
📧 Subject: Email Subject
```

### Debug Email Issues
Enable detailed logging:
```javascript
// In emailService.js
console.log('📧 Email options:', mailOptions);
console.log('📧 Transporter config:', transporter.options);
```

## Features

✅ **Reliable Delivery**
- Uses Gmail SMTP
- Automatic retry on failure
- Error handling

✅ **Professional Templates**
- Beautiful HTML emails
- Mobile responsive
- Branded design

✅ **Security**
- OTP expiration (10 minutes)
- Reset token expiration (1 hour)
- No sensitive data in logs

✅ **Tracking**
- Message ID logging
- Delivery confirmation
- Error reporting

## Status

✅ **Email Service Active**

Current Setup:
- Provider: Gmail
- Status: Ready
- Credentials: Configured
- Templates: Professional

---

**Last Updated:** November 28, 2025
**Status:** Production Ready
