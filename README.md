# HealthSync — Clinic Appointment & Patient Management Platform

> India's clinic-first healthcare management platform. Book doctor appointments online, manage clinic queues, patient records & scheduling.

🌐 **Live:** [healthsyncpro.in](https://healthsyncpro.in)  
📱 **Mobile App:** React Native (Android)  
🔧 **Backend API:** [doctor-appointment-system-updated.onrender.com](https://doctor-appointment-system-updated.onrender.com/api/health)  
📚 **API Docs:** [/api/docs](https://doctor-appointment-system-updated.onrender.com/api/docs)

---

## 🏗️ Project Structure

```
doctor-appointment-system/
├── frontend/          # React web app (deployed on Vercel)
├── backend/           # Node.js + Express API (deployed on Render)
├── healthsync-pro/    # React Native mobile app (Android)
├── mobile/            # Legacy mobile copy (deprecated — use healthsync-pro)
└── render.yaml        # Render deployment config
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Android Studio (for mobile)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in your values in .env
npm install
npm start
```

### 3. Mobile App Setup
```bash
cd healthsync-pro
cp .env.example .env
# Fill in your values in .env
npm install
npx react-native run-android
```

---

## � User Roles

| Role | Access | Login |
|------|--------|-------|
| **Patient** | Book appointments, view records, track queue | `/login` |
| **Doctor** | Manage schedule, view patients, write prescriptions | `/doctor-login` |
| **Staff/Receptionist** | Manage clinic queue, register walk-ins, billing | `/clinic-login` |
| **Admin** | Full system access, analytics, user management | `/admin-login` |

---

## 🔑 Key Features

### For Patients
- 📅 Online appointment booking (in-clinic & video)
- 🔢 Real-time queue tracking
- 💊 Digital prescriptions & lab reports
- 👨‍👩‍👧 Family member management
- 🏆 Loyalty points & rewards
- 🤖 AI health assistant & symptom checker
- 💳 Razorpay payment integration

### For Doctors
- � Patient queue management
- 📝 EMR & prescription writing
- 📊 Earnings dashboard
- 🎥 Video consultation (Google Meet / Jitsi)
- 📅 Schedule & leave management
- 💬 Patient chat

### For Clinic Staff
- 🚶 Walk-in patient registration
- 📋 Queue management
- 💰 Billing & invoicing
- 📊 Daily reports
- 🏥 Pharmacy inventory

### For Admins
- 👥 User & doctor management
- 🏥 Clinic management
- 📊 Analytics & revenue reports
- 🔒 Security monitoring
- 📧 Bulk email campaigns
- 🎟️ Coupon management

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Tailwind CSS + Bootstrap 5
- Socket.IO (real-time updates)
- Razorpay (payments)
- Capacitor (mobile wrapper)
- i18next (English + Bengali + Hindi)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- Nodemailer + Resend (email)
- Twilio + MSG91 (SMS/WhatsApp)
- Cloudinary (file storage)
- Google Meet API
- Gemini AI

### Mobile (React Native)
- React Native 0.73
- React Navigation
- React Native Keychain (secure storage)
- Firebase (push notifications)
- React Native Biometrics

---

## 🔐 Security

- JWT authentication with 24h expiry
- Rate limiting on all endpoints
- Input sanitization (XSS, NoSQL injection prevention)
- CORS configured for production domains
- Security headers (X-Frame-Options, CSP, HSTS)
- Admin login email alerts
- IP-based suspicious activity monitoring
- Force logout capability

**⚠️ IMPORTANT:** Never commit `.env` files. All secrets must be set as environment variables in your deployment platform.

---

## 🌐 Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variables in Vercel dashboard
4. Deploy

### Backend (Render)
1. Connect GitHub repo to Render
2. Use `render.yaml` for automatic configuration
3. Set secret environment variables in Render dashboard (MONGODB_URI, JWT_SECRET, etc.)
4. Deploy

---

## 📱 Mobile Build

```bash
cd healthsync-pro

# Debug APK
npx react-native run-android

# Release APK
cd android
./gradlew assembleRelease

# Release AAB (for Play Store)
./gradlew bundleRelease
```

---

## 🧪 API Testing

API documentation available at: `https://doctor-appointment-system-updated.onrender.com/api/docs`

Health check: `GET /api/health`

---

## 📞 Support

- Email: support@healthsyncpro.in
- Website: healthsyncpro.in

---

## � License

MIT License — see [LICENSE](LICENSE) file.
