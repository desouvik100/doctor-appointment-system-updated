# Add Environment Variables to Render

Your backend is deployed but needs environment variables to work.

## Steps:

1. Go to: https://dashboard.render.com
2. Click your service: `doctor-appointment-system-updated`
3. Click **Environment** (left sidebar)
4. Click **Add Environment Variable**
5. Copy-paste each variable below

---

## Required Variables (CRITICAL)

```
MONGODB_URI=mongodb+srv://desouvik100:Souvik1234@cluster0.qv72ila.mongodb.net/doctor_appointment?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=souvik_doctor_app_9d8f1c0e3b4a7f12c5a6

NODE_ENV=production

BACKEND_URL=https://doctor-appointment-system-updated.onrender.com

FRONTEND_URL=https://healthsyncpro.in

CORS_ORIGIN=https://healthsyncpro.in
```

---

## Payment Configuration

```
RAZORPAY_KEY_ID=rzp_live_SslSMIjAO5GSUc

RAZORPAY_KEY_SECRET=WOcyq5hdHNTDk7Dny3xaSIRg

RAZORPAY_MODE=live

USE_RAZORPAY_PAYMENTS=true

RAZORPAY_WEBHOOK_SECRET=souvik@healthsyncpro.in

CURRENCY=INR

PLATFORM_FEE_PERCENTAGE=5

GST_PERCENTAGE=0
```

---

## Email Configuration

```
EMAIL_USER=desouvik0000@gmail.com

EMAIL_PASS=vbhfhnzuhodxuxrq

ADMIN_EMAIL=desouvik0000@gmail.com

RESEND_API_KEY=re_ZiVu58bq_BHnJKJ2kvpSgn3rynU5cyb5Y

RESEND_FROM_EMAIL=Doctor Appointment <no-reply@healthsyncpro.in>
```

---

## AI Configuration

```
GEMINI_API_KEY=AIzaSyDEAHN66GjuNqihGt0O1oWzYdOQMUeYUPs

AI_PROVIDER=gemini

OPENAI_API_KEY=your_openai_api_key_here
```

---

## Google OAuth Configuration

```
GOOGLE_CLIENT_ID=your_google_client_id_here

GOOGLE_CLIENT_SECRET=your_google_client_secret_here

GOOGLE_REDIRECT_URI=https://doctor-appointment-system-updated.onrender.com/api/google/auth-url

GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
```

---

## Other Configuration

```
TIMEZONE=Asia/Kolkata

SMS_PROVIDER=msg91

MSG91_AUTH_KEY=your_msg91_auth_key_here

MSG91_SENDER_ID=HLTHSN

TWILIO_ACCOUNT_SID=your_twilio_account_sid_here

TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

TWILIO_PHONE_NUMBER=+1234567890

TWILIO_WHATSAPP_NUMBER=+14155238886

MSG91_WHATSAPP_AUTH_KEY=your_msg91_whatsapp_key_here

MSG91_WHATSAPP_NUMBER=+919876543210

WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here

WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here

WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id_here

WHATSAPP_VERIFY_TOKEN=healthsync_whatsapp_verify

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here

CLOUDINARY_API_KEY=your_cloudinary_api_key_here

CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

TEST_APPOINTMENT=false
```

---

## After Adding Variables:

1. Click **Save**
2. Render will automatically redeploy
3. Wait 2-3 minutes
4. Check: https://doctor-appointment-system-updated.onrender.com/api/health
5. You should see: `{"status":"ok"}`

---

## Quick Add (Copy-Paste All at Once)

If Render supports bulk import, paste this entire block:

```
MONGODB_URI=mongodb+srv://desouvik100:Souvik1234@cluster0.qv72ila.mongodb.net/doctor_appointment?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=souvik_doctor_app_9d8f1c0e3b4a7f12c5a6
NODE_ENV=production
BACKEND_URL=https://doctor-appointment-system-updated.onrender.com
FRONTEND_URL=https://healthsyncpro.in
CORS_ORIGIN=https://healthsyncpro.in
RAZORPAY_KEY_ID=rzp_live_SslSMIjAO5GSUc
RAZORPAY_KEY_SECRET=WOcyq5hdHNTDk7Dny3xaSIRg
RAZORPAY_MODE=live
USE_RAZORPAY_PAYMENTS=true
RAZORPAY_WEBHOOK_SECRET=souvik@healthsyncpro.in
CURRENCY=INR
PLATFORM_FEE_PERCENTAGE=5
GST_PERCENTAGE=0
EMAIL_USER=desouvik0000@gmail.com
EMAIL_PASS=vbhfhnzuhodxuxrq
ADMIN_EMAIL=desouvik0000@gmail.com
RESEND_API_KEY=re_ZiVu58bq_BHnJKJ2kvpSgn3rynU5cyb5Y
RESEND_FROM_EMAIL=Doctor Appointment <no-reply@healthsyncpro.in>
GEMINI_API_KEY=AIzaSyDEAHN66GjuNqihGt0O1oWzYdOQMUeYUPs
AI_PROVIDER=gemini
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://doctor-appointment-system-updated.onrender.com/api/google/auth-url
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
TIMEZONE=Asia/Kolkata
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_msg91_auth_key_here
MSG91_SENDER_ID=HLTHSN
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886
MSG91_WHATSAPP_AUTH_KEY=your_msg91_whatsapp_key_here
MSG91_WHATSAPP_NUMBER=+919876543210
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id_here
WHATSAPP_VERIFY_TOKEN=healthsync_whatsapp_verify
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
TEST_APPOINTMENT=false
```

---

**Done! Your backend will now connect to MongoDB and work perfectly!**
