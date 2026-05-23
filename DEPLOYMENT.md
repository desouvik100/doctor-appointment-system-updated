# HealthSync Deployment Guide

## 🚀 Production Deployment Checklist

### Before Deploying

- [ ] All secrets set in platform environment variables (NOT in code)
- [ ] MongoDB Atlas connection string tested
- [ ] JWT_SECRET is strong (64+ random characters)
- [ ] Razorpay keys are LIVE mode keys
- [ ] Email credentials tested
- [ ] CORS_ORIGIN matches your frontend domain exactly

---

## 🌐 Frontend — Vercel

### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Framework: **Create React App**

### 2. Environment Variables (Vercel Dashboard → Settings → Environment Variables)
```
REACT_APP_API_URL=https://doctor-appointment-system-updated.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. Deploy
```bash
# Vercel auto-deploys on git push to main
git push origin main
```

### 4. Custom Domain
1. Vercel Dashboard → Domains → Add `healthsyncpro.in`
2. Add DNS records in Cloudflare:
   - Type: `CNAME`, Name: `@`, Value: `cname.vercel-dns.com`
   - Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`

---

## 🖥️ Backend — Render

### 1. Connect Repository
1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repository
3. Set **Root Directory** to `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`

### 2. Environment Variables (Render Dashboard → Environment)

**Required (must set manually — never commit these):**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/doctor_appointment
JWT_SECRET=your_64_char_random_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_live_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Auto-set from render.yaml:**
```
NODE_ENV=production
PORT=5005
FRONTEND_URL=https://healthsyncpro.in
CORS_ORIGIN=https://healthsyncpro.in
BACKEND_URL=https://doctor-appointment-system-updated.onrender.com
TIMEZONE=Asia/Kolkata
CURRENCY=INR
```

### 3. Health Check
After deployment, verify: `https://doctor-appointment-system-updated.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "database": { "status": "connected" },
  "uptime": 123
}
```

---

## 📱 Mobile App — Android

### Debug Build (for testing)
```bash
cd healthsync-pro
npm install
npx react-native run-android
```

### Release APK (for distribution)
```bash
cd healthsync-pro/android

# Generate release APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Release AAB (for Play Store)
```bash
cd healthsync-pro/android

# Generate release bundle
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Signing Setup
1. Generate keystore (one-time):
```bash
keytool -genkey -v -keystore healthsync-release.keystore \
  -alias healthsync -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/keystore.properties`:
```properties
storeFile=healthsync-release.keystore
storePassword=your_keystore_password
keyAlias=healthsync
keyPassword=your_key_password
```

3. Copy keystore to `android/app/healthsync-release.keystore`

---

## 🔧 Common Issues & Fixes

### Backend won't start
```
❌ FATAL: JWT_SECRET environment variable is not set
```
**Fix:** Set `JWT_SECRET` in Render environment variables

### MongoDB connection fails
```
❌ FATAL: MongoDB authentication failed
```
**Fix:** Check `MONGODB_URI` in Render dashboard — ensure username/password are URL-encoded

### CORS errors in browser
```
CORS: origin 'https://healthsyncpro.in' not allowed
```
**Fix:** Set `CORS_ORIGIN=https://healthsyncpro.in` in Render environment variables

### Render cold start (30-60 second delay)
This is normal for free tier. The frontend already has a wake-up ping on load.
**Fix for production:** Upgrade to Render paid plan ($7/month) for always-on service

### Email not sending
```
⚠️ Gmail SMTP unavailable
```
**Fix:** 
1. Enable 2FA on Gmail account
2. Create App Password at myaccount.google.com/apppasswords
3. Use the 16-character app password as `EMAIL_PASS`

### Razorpay payment fails
**Fix:** Ensure `RAZORPAY_MODE=live` and keys are from live dashboard (not test)

---

## 📊 Monitoring

### Health Check Endpoint
```
GET /api/health
```

### API Documentation
```
GET /api/docs
```

### Logs
- Render: Dashboard → Logs tab
- Vercel: Dashboard → Deployments → View logs

---

## 🔄 CI/CD Pipeline

Currently using manual deployment. To set up auto-deploy:

1. **Render:** Auto-deploys on push to `main` branch (enabled by default)
2. **Vercel:** Auto-deploys on push to `main` branch (enabled by default)

### Recommended Branch Strategy
```
main          → Production (auto-deploy)
develop       → Staging
feature/*     → Feature branches (PR to develop)
```

---

## 🛡️ Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enforced (Vercel/Render handle this)
- [ ] CORS restricted to production domain
- [ ] Rate limiting active
- [ ] MongoDB IP whitelist configured (Atlas)
- [ ] Cloudflare Bot Fight Mode OFF (for SEO)
- [ ] Cloudflare SSL set to "Full" (not Flexible)
