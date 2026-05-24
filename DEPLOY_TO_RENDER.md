# Deploy Backend to Render (Cloud)

This will make your backend accessible from anywhere, including your mobile app!

## Why Cloud Deployment?

✅ No VPN needed  
✅ MongoDB works automatically  
✅ Mobile app can connect from anywhere  
✅ Free tier available  
✅ No local machine needed to run backend  

---

## Step 1: Push Code to GitHub

```bash
cd d:\Startup-Project\doctor-appointment-system
git add .
git commit -m "Deploy to Render"
git push origin main
```

---

## Step 2: Create Render Account

1. Go to: https://render.com
2. Click **Sign Up**
3. Sign up with GitHub (recommended)
4. Authorize Render to access your GitHub

---

## Step 3: Create New Web Service

1. Go to: https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Select your GitHub repo: `doctor-appointment-system-updated`
4. Click **Connect**

---

## Step 4: Configure Service

**Name:** `doctor-appointment-system-updated`

**Environment:** `Node`

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Plan:** Free (or Starter if you want better performance)

---

## Step 5: Add Environment Variables

Click **Environment** and add these:

```
MONGODB_URI=mongodb+srv://desouvik100:Souvik1234@cluster0.qv72ila.mongodb.net/doctor_appointment?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=souvik_doctor_app_9d8f1c0e3b4a7f12c5a6

PORT=5005

NODE_ENV=production

BACKEND_URL=https://doctor-appointment-system-updated.onrender.com

FRONTEND_URL=https://healthsyncpro.in

CORS_ORIGIN=https://healthsyncpro.in

RAZORPAY_KEY_ID=your_razorpay_key_id_here

RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

RAZORPAY_MODE=live

USE_RAZORPAY_PAYMENTS=true

RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

CURRENCY=INR

PLATFORM_FEE_PERCENTAGE=5

GST_PERCENTAGE=0

EMAIL_USER=your_email_here

EMAIL_PASS=your_email_app_password_here

ADMIN_EMAIL=your_admin_email_here

RESEND_API_KEY=your_resend_api_key_here

RESEND_FROM_EMAIL=Doctor Appointment <no-reply@healthsyncpro.in>

OPENAI_API_KEY=your_openai_api_key_here

GEMINI_API_KEY=your_gemini_api_key_here

AI_PROVIDER=gemini

GOOGLE_CLIENT_ID=your_google_client_id_here

GOOGLE_CLIENT_SECRET=your_google_client_secret_here

GOOGLE_REDIRECT_URI=https://doctor-appointment-system-updated.onrender.com/api/google/callback

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

## Step 6: Deploy

Click **Create Web Service**

Render will:
1. Clone your repo
2. Install dependencies
3. Start your backend
4. Give you a URL: `https://doctor-appointment-system-updated.onrender.com`

---

## Step 7: Update Mobile App

Your mobile app `.env` already has:
```
API_URL=https://doctor-appointment-system-updated.onrender.com/api
```

So it will automatically connect to the cloud backend!

---

## Step 8: Test

1. Wait 2-3 minutes for deployment
2. Visit: https://doctor-appointment-system-updated.onrender.com/api/health
3. You should see: `{"status":"ok"}`

---

## Mobile App Will Now Work!

Your mobile app will:
✅ Connect to cloud backend  
✅ Access MongoDB automatically  
✅ Work from anywhere  
✅ No local machine needed  

---

## Free Tier Limitations

- Service spins down after 15 minutes of inactivity
- First request takes 30 seconds to wake up
- Upgrade to Starter ($7/month) for always-on

---

**Ready to deploy? Follow the steps above!**
