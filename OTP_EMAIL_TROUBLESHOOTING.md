# 🔧 OTP Email Not Received - Troubleshooting Guide

## 🎯 Quick Diagnosis

### **Step 1: Test Email Service**

Run this command in the backend directory:

```bash
cd backend
node test-otp-email.js
```

This will show you:
- ✅ Which email service is configured
- ✅ If API keys are set
- ✅ If email sends successfully
- ❌ Any errors preventing email delivery

---

## 🔍 Common Issues & Solutions

### **Issue 1: Resend API Key Not Set**

**Symptoms:**
- Error: "RESEND_API_KEY is not set"
- OTP not sending

**Solution:**

1. Check `backend/.env` file has:
   ```env
   RESEND_API_KEY=re_WjxmsDdD_KufJKZVoBCD5CKUF5U75nszd
   RESEND_FROM_EMAIL=Doctor Appointment <no-reply@healthsyncpro.in>
   ```

2. Verify the API key is valid at https://resend.com/api-keys

3. Restart backend server after updating .env

---

### **Issue 2: Invalid From Email**

**Symptoms:**
- Error: "Invalid from email"
- Email service fails

**Solution:**

The from email must be in format:
```
Name <email@domain.com>
```

Example:
```env
RESEND_FROM_EMAIL=HealthSync <noreply@yourdomain.com>
```

For testing, you can use:
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

### **Issue 3: Resend Domain Not Verified**

**Symptoms:**
- Email sends but never arrives
- No error in console

**Solution:**

1. Go to https://resend.com/domains
2. Add and verify your domain
3. Or use Resend's test domain: `onboarding@resend.dev`

---

### **Issue 4: Email in Spam Folder**

**Symptoms:**
- No error
- Email not in inbox

**Solution:**

1. **Check spam/junk folder**
2. **Check promotions tab** (Gmail)
3. **Wait 2-3 minutes** for delivery
4. **Add sender to contacts** to prevent spam filtering

---

### **Issue 5: Gmail Blocking**

**Symptoms:**
- Using Gmail SMTP
- Emails not sending

**Solution:**

If using Gmail (EMAIL_USER/EMAIL_PASS):

1. **Enable 2-Factor Authentication**
2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Generate new app password
   - Use that in EMAIL_PASS

3. **Update .env:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

---

## 🧪 Testing Steps

### **Test 1: Check Backend Console**

When you click "Send OTP", check backend console for:

```
🔔 sendOTP called for: user@example.com type: password-reset
Generated OTP: 123456 for key: user@example.com|password-reset
✅ Resend email sent, id: abc123
```

If you see errors, they'll appear here.

---

### **Test 2: Test API Directly**

Use curl or Postman:

```bash
curl -X POST http://localhost:5005/api/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","type":"password-reset"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

---

### **Test 3: Check Email Config**

```bash
curl http://localhost:5005/api/otp/check-config
```

Should show:
```json
{
  "success": true,
  "config": {
    "emailUser": "configured",
    "emailPass": "configured"
  }
}
```

---

## 🔄 Switch to Gmail SMTP (Alternative)

If Resend isn't working, switch to Gmail:

### **1. Update emailService.js**

Create `backend/services/emailService-gmail.js`:

```javascript
const nodemailer = require('nodemailer');

// In-memory OTP store
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gmail transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTP(email, type = 'register') {
  const otp = generateOTP();
  const key = `${email}|${type}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(key, { otp, expiresAt });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code - HealthSync',
    html: `
      <h2>HealthSync - Password Reset</h2>
      <p>Your OTP code is:</p>
      <h1 style="color: #667eea; font-size: 32px;">${otp}</h1>
      <p>This code is valid for <b>10 minutes</b>.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);

  return { success: true, message: 'OTP sent successfully' };
}

function verifyOTP(email, otp, type = 'register') {
  const key = `${email}|${type}`;
  const record = otpStore.get(key);

  if (!record) {
    return { success: false, message: 'No OTP found. Please request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { success: false, message: 'OTP expired. Please request a new one.' };
  }

  if (record.otp !== otp) {
    return { success: false, message: 'Invalid OTP.' };
  }

  otpStore.delete(key);
  return { success: true, message: 'OTP verified successfully.' };
}

module.exports = { sendOTP, verifyOTP };
```

### **2. Update .env**

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### **3. Rename files**

```bash
cd backend/services
mv emailService.js emailService-resend.js
mv emailService-gmail.js emailService.js
```

### **4. Restart backend**

```bash
node server.js
```

---

## 📊 Debugging Checklist

- [ ] Backend server is running
- [ ] OTP routes are registered (check console on startup)
- [ ] .env file has email configuration
- [ ] API keys are valid
- [ ] From email is in correct format
- [ ] Domain is verified (for Resend)
- [ ] Checked spam folder
- [ ] Waited 2-3 minutes for delivery
- [ ] Tested with curl/Postman
- [ ] Checked backend console for errors
- [ ] Tried different email address

---

## 🆘 Still Not Working?

### **Option 1: Use Console OTP (Development Only)**

For testing, you can log OTP to console instead of sending email.

Update `backend/services/emailService.js`:

```javascript
async function sendOTP(email, type = 'register') {
  const otp = generateOTP();
  const key = `${email}|${type}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(key, { otp, expiresAt });

  // FOR DEVELOPMENT: Log OTP to console
  console.log('═══════════════════════════════');
  console.log('🔐 OTP FOR TESTING');
  console.log('Email:', email);
  console.log('OTP:', otp);
  console.log('Valid for: 10 minutes');
  console.log('═══════════════════════════════');

  // Comment out email sending for now
  // await sendEmail({ to: email, subject, html, text });

  return { success: true, message: 'OTP sent successfully' };
}
```

Then check backend console for the OTP!

---

### **Option 2: Contact Support**

If using Resend:
- Check https://resend.com/docs
- Contact support@resend.com
- Check API status: https://status.resend.com

---

## ✅ Success Indicators

When working correctly, you should see:

1. **Backend Console:**
   ```
   🔔 sendOTP called for: user@example.com
   Generated OTP: 123456
   ✅ Resend email sent, id: abc123
   ```

2. **Frontend:**
   - "OTP sent successfully" message
   - Step 2 (Enter OTP) appears

3. **Email Inbox:**
   - Email arrives within 1-2 minutes
   - Subject: "Your OTP Code"
   - Contains 6-digit code

---

*Follow these steps to diagnose and fix OTP email delivery issues!* 📧✅
