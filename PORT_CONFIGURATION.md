# Port Configuration Guide

## Current Configuration

### Backend Port
**Port: 5005** (default)

**File:** `backend/server.js`
```javascript
const PORT = process.env.PORT || 5005;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Frontend API Configuration
**Port: 5005** (default)

**File:** `frontend/src/api/config.js`
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://doctor-appointment-backend.onrender.com'
    : 'http://localhost:5005' // Local backend on port 5005
);
```

## Starting the Application

### Backend (Port 5005)
```bash
cd backend
npm start
```

**Expected Output:**
```
✅ Server running on port 5005
✅ Health check available at http://localhost:5005/api/health
```

### Frontend (Port 3000)
```bash
cd frontend
npm start
```

**Expected Output:**
```
✅ Compiled successfully!
✅ You can now view the app in the browser at http://localhost:3000
```

## Port Summary

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5005 | http://localhost:5005 |
| Frontend App | 3000 | http://localhost:3000 |
| MongoDB | 27017 | mongodb://localhost:27017 |

## Changing Ports

### Change Backend Port
**Option 1: Environment Variable**
```bash
# Windows
set PORT=5000
npm start

# Linux/Mac
PORT=5000 npm start
```

**Option 2: Edit server.js**
```javascript
const PORT = process.env.PORT || 5000; // Change 5005 to 5000
```

### Change Frontend API Port
**Option 1: Environment Variable**
```bash
# Windows
set REACT_APP_API_URL=http://localhost:5000
npm start

# Linux/Mac
REACT_APP_API_URL=http://localhost:5000 npm start
```

**Option 2: Edit config.js**
```javascript
const API_BASE_URL = 'http://localhost:5000'; // Change 5005 to 5000
```

## Troubleshooting

### Port Already in Use
If you get "Port already in use" error:

**Windows:**
```bash
# Find process using port 5005
netstat -ano | findstr :5005

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find process using port 5005
lsof -i :5005

# Kill process (replace PID with actual process ID)
kill -9 <PID>
```

### Backend Not Responding
1. Check if backend is running on port 5005
2. Check if frontend is pointing to correct port
3. Check browser console for API errors
4. Check backend console for errors

### CORS Errors
If you see CORS errors:
1. Verify backend is running
2. Verify frontend API URL is correct
3. Check backend CORS configuration

## Health Check

### Test Backend
```bash
curl http://localhost:5005/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Test Frontend
Open browser and go to:
```
http://localhost:3000
```

## Production Deployment

### Backend
- Use environment variable: `PORT=5005`
- Or set in `.env` file: `PORT=5005`
- Use production MongoDB URI

### Frontend
- Set `REACT_APP_API_URL` to production backend URL
- Example: `https://api.yourdomain.com`

## Environment Variables

### Backend (.env)
```
PORT=5005
MONGODB_URI=mongodb://localhost:27017/doctor_appointment
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5005
REACT_APP_ENV=development
```

## Quick Start Commands

### Start Everything
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5005
- Health Check: http://localhost:5005/api/health

---

**Current Setup:** Backend on 5005, Frontend on 3000
**Status:** ✅ Ready to Use
