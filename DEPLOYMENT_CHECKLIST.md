# HealthSync Pro Deployment Checklist

## Current Status
❌ Backend not responding at deployment URL
❌ Chatbot not appearing in admin dashboard on production

## Issues Fixed
✅ Cleaned up duplicate entries in backend/.env
✅ Set correct CORS_ORIGIN for production
✅ Updated frontend/.env.production with correct backend URL
✅ Fixed PORT configuration in server.js

## Deployment Steps

### 1. Test Backend Locally
```bash
# Start backend locally
cd backend
npm start

# In another terminal, test the backend
node test-local-backend.js
```

### 2. Deploy Backend to Render
Your render.yaml is configured correctly. To deploy:

1. **Push your changes to GitHub** (the updated .env and server.js files)
2. **Go to Render Dashboard** (https://dashboard.render.com)
3. **Find your backend service** (doctor-appointment-backend)
4. **Trigger a manual deploy** or it should auto-deploy from GitHub
5. **Check the deployment logs** for any errors

### 3. Verify Backend Deployment
```bash
# Test the deployed backend
node test-deployment.js
```

### 4. Deploy Frontend to Vercel
```bash
# Deploy frontend
cd frontend
npm run build
# Deploy to Vercel (if using Vercel CLI)
vercel --prod
```

### 5. Environment Variables on Render
Make sure these environment variables are set on Render:
- `NODE_ENV=production`
- `MONGODB_URI` (your MongoDB connection string)
- `JWT_SECRET`
- `CORS_ORIGIN=https://doctor-appointment-system-updated.vercel.app`
- `GEMINI_API_KEY` (for AI chatbot)
- `EMAIL_USER` and `EMAIL_PASS` (for OTP emails)

### 6. Environment Variables on Vercel
Make sure these are set on Vercel:
- `REACT_APP_API_URL=https://doctor-appointment-backend.onrender.com`
- `NODE_ENV=production`

## Common Issues & Solutions

### Backend Not Responding
1. Check Render deployment logs
2. Verify environment variables are set
3. Ensure MongoDB connection is working
4. Check if the service is sleeping (free tier)

### CORS Errors
1. Verify CORS_ORIGIN matches your frontend URL exactly
2. Check that both HTTP and HTTPS are handled correctly

### Chatbot Not Working
1. Verify `/api/chatbot` routes are accessible
2. Check Gemini API key is valid
3. Test fallback mode is working

## Testing Commands

```bash
# Test local backend
node test-local-backend.js

# Test deployed backend
node test-deployment.js

# Test different backend URLs
node test-backend-urls.js
```

## Next Steps
1. Deploy backend to Render with the updated configuration
2. Test the deployed backend URL
3. Deploy frontend to Vercel
4. Test the complete application flow