# HealthSync - Doctor Appointment System

A healthcare management platform for clinic-based appointment scheduling, patient records, and telemedicine consultations.

**Production:** [healthsyncpro.in](https://healthsyncpro.in)  
**API:** [doctor-appointment-system-updated.onrender.com](https://doctor-appointment-system-updated.onrender.com/api/health)  
**Documentation:** [/api/docs](https://doctor-appointment-system-updated.onrender.com/api/docs)

---

## Architecture

```
doctor-appointment-system/
├── frontend/          # React web application
├── backend/           # Node.js REST API
├── healthsync-pro/    # React Native mobile app
└── render.yaml        # Deployment configuration
```

---

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

### Mobile
```bash
cd healthsync-pro
npm install
npx react-native run-android
```

---

## User Roles

| Role | Endpoint |
|------|----------|
| Patient | `/login` |
| Doctor | `/doctor-login` |
| Staff | `/clinic-login` |
| Admin | `/admin-login` |

---

## Technology Stack

**Frontend:** React 18, Tailwind CSS, Socket.IO  
**Backend:** Node.js, Express, MongoDB, JWT  
**Mobile:** React Native 0.73, Firebase  
**Services:** Razorpay, Twilio, Cloudinary, Google Meet API

---

## Deployment

**Frontend:** Vercel (automatic from `main` branch)  
**Backend:** Render (configured via `render.yaml`)  
**Mobile:** Android APK/AAB, iOS via Xcode

---

## Security

- JWT authentication (1h access + 7d refresh tokens)
- bcrypt password hashing
- Rate limiting (100 req/15min)
- CORS whitelisting
- Input sanitization

---

## API

Health check: `GET /api/health`  
Full documentation: `/api/docs`

Authentication required via `Authorization: Bearer <token>` header.

---

## License

MIT License - see [LICENSE](LICENSE) file.
