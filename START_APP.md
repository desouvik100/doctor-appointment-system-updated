# 🚀 How to Start the Application

## Quick Start (Windows)

### Option 1: Use Batch File
Double-click `start-servers.bat` to start both backend and frontend

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## ✅ Verify It's Working

1. **Backend**: Open http://localhost:5001/api/health
   - Should show: `{"status":"OK","database":"Connected"}`

2. **Frontend**: Open http://localhost:3000
   - Should show the login page

---

## 🔧 If It's Not Working

### Backend Issues:
- ✅ Check MongoDB is running
- ✅ Check port 5001 is not in use
- ✅ Verify `backend/.env` exists (or create it from `.env.example`)

### Frontend Issues:
- ✅ Check backend is running first
- ✅ Clear browser cache
- ✅ Check browser console for errors

---

## 📝 First Time Setup

1. **Install MongoDB** (if not installed)
2. **Create backend/.env**:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/doctor_appointment
   PORT=5001
   JWT_SECRET=your-secret-key
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Populate Database** (after starting backend):
   ```bash
   cd backend
   node quick-populate.js
   ```

---

## 🎯 Default Login Credentials

After populating database:
- **Admin**: `admin@hospital.com` / `admin123`
- **Patient**: `john.doe@email.com` / `password123`
- **Receptionist**: `reception1@citygeneral.com` / `reception123`

---

## 🐛 Common Issues Fixed

✅ **API Connection**: Fixed hardcoded URLs - now uses environment variables
✅ **CORS**: Configured to allow localhost:3000
✅ **Port**: Backend runs on 5001, frontend on 3000

---

**The application should now work!** 🎉

