# 🔄 Backend Server Restart Required

## ⚠️ Important: Restart Backend to Enable Password Reset

The password reset feature requires the backend server to be restarted to load the new OTP routes.

---

## 🚀 How to Restart Backend

### **Option 1: Using Command Line**

1. **Stop the current backend server:**
   - Press `Ctrl + C` in the terminal running the backend

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

   Or if using nodemon:
   ```bash
   npm run dev
   ```

### **Option 2: Using start-app.bat**

If you have the batch file:
```bash
start-app.bat
```

---

## ✅ Verify Routes are Loaded

After restarting, you should see in the console:

```
=== REGISTERED ROUTES ===
Auth Routes:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/admin/login
  POST /api/auth/receptionist/register
  GET  /api/auth/receptionist/test

OTP Routes:
  POST /api/otp/send-otp
  POST /api/otp/verify-otp
  GET  /api/otp/check-config
========================
```

---

## 🧪 Test Password Reset

Once backend is restarted:

1. **Go to frontend** (http://localhost:3001)
2. **Click "Forgot Password"**
3. **Enter your email**
4. **Click "Send OTP"**
5. **Check your email** for the 6-digit OTP
6. **Enter OTP** and verify
7. **Set new password**
8. **Login** with new password

---

## 🔍 Troubleshooting

### **Still getting "Failed to send OTP"?**

1. **Check backend is running:**
   ```bash
   curl http://localhost:5005/api/health
   ```

2. **Check OTP config:**
   ```bash
   curl http://localhost:5005/api/otp/check-config
   ```

3. **Check backend logs** for errors

4. **Verify email configuration** in `backend/.env`:
   ```env
   RESEND_API_KEY=your_key_here
   RESEND_FROM_EMAIL=your_email_here
   ```

### **Email not arriving?**

1. Check spam folder
2. Verify email service is configured
3. Check backend console for email sending logs
4. Test email service:
   ```bash
   curl -X POST http://localhost:5005/api/otp/send-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","type":"password-reset"}'
   ```

---

## 📝 What Was Added

### **Backend Changes:**

1. **server.js** - Added OTP routes registration:
   ```javascript
   app.use('/api/otp', require('./routes/otpRoutes'));
   ```

2. **authRoutes.js** - Added password reset endpoint:
   ```javascript
   POST /api/auth/reset-password
   ```

### **Frontend Changes:**

1. **Auth.js** - Added 3-step password reset flow
2. **Auth.js** - Added notification fallback function

---

## ✅ After Restart

Everything should work:
- ✅ Send OTP
- ✅ Verify OTP
- ✅ Reset Password
- ✅ Login with new password

---

*Restart your backend server now to enable the password reset feature!* 🚀
