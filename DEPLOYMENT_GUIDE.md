# Deployment Guide

## Issues Fixed

### 1. Admin/Receptionist Login Issue
- **Problem**: "Invalid admin credentials" error
- **Cause**: Backend server not running or incorrect API URL
- **Solution**: 
  - Updated API configuration to handle both development and production
  - Added environment variables for flexible backend URL configuration

### 2. Vercel Build Error (Stripe Module)
- **Problem**: `Module not found: Error: Can't resolve '@stripe/react-stripe-js'`
- **Cause**: Stripe packages not installed but being imported
- **Solution**: 
  - Made Stripe imports conditional to prevent build failures
  - Added Stripe packages as optional dependencies
  - Created fallback components when Stripe is not available

## Deployment Steps

### Backend Deployment (Render)

1. **Deploy to Render**:
   - Connect your GitHub repository to Render
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables in Render dashboard

2. **Environment Variables for Backend**:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=production
   ```

3. **Get your backend URL** (e.g., `https://your-app-name.onrender.com`)

### Frontend Deployment (Vercel)

1. **Update Environment Variables**:
   - In `frontend/.env.production`, replace `https://your-backend-url.onrender.com` with your actual Render URL
   - Or set `REACT_APP_API_URL` in Vercel dashboard

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Set root directory to `frontend`
   - Add environment variables in Vercel dashboard:
     ```
     REACT_APP_API_URL=https://your-backend-url.onrender.com
     NODE_ENV=production
     ```

## Testing Locally

### 1. Test Backend Server
```bash
cd backend
npm install
npm start
```

### 2. Test Admin Login
```bash
node test-admin-login.js
```

### 3. Test Frontend
```bash
cd frontend
npm install
npm start
```

## Login Credentials

After running the populate script (`node populate-mongodb.js`):

- **Admin**: 
  - Email: `admin@hospital.com`
  - Password: `admin123`

- **Patient**: 
  - Email: `john.doe@email.com`
  - Password: `password123`

- **Receptionist**: 
  - Email: `reception1@citygeneral.com`
  - Password: `reception123`

## Troubleshooting

### "Invalid admin credentials" Error
1. Ensure backend server is running
2. Check if database is populated with admin user
3. Verify API URL is correct in frontend configuration
4. Check browser network tab for actual error responses

### Vercel Build Errors
1. Ensure all required dependencies are in `package.json`
2. Check that optional dependencies (like Stripe) are properly handled
3. Verify environment variables are set correctly

### CORS Issues in Production
If you get CORS errors, add your frontend domain to the backend CORS configuration:

```javascript
// In backend/server.js
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

## Features Included

✅ **AI Health Assistant** - Integrated into patient dashboard
✅ **Admin Dashboard** - User and appointment management  
✅ **Receptionist Dashboard** - Clinic management
✅ **Patient Dashboard** - Doctor search, appointments, AI assistant
✅ **Authentication** - Secure login for all user types
✅ **Payment Integration** - Optional Stripe integration (graceful fallback)
✅ **Responsive Design** - Works on all devices
✅ **Error Handling** - Comprehensive error management