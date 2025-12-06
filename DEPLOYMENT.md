# HealthSync Pro - Deployment Guide

## 🚀 Deployment Options

### Option 1: Render (Backend) + Vercel (Frontend) - Recommended

#### Step 1: Deploy Backend to Render

1. **Create Render Account**: Go to https://render.com and sign up

2. **Connect GitHub**: Link your GitHub repository

3. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect your repository
   - Configure:
     - **Name**: `healthsync-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free (or paid for better performance)

4. **Add Environment Variables** in Render Dashboard:
   ```
   NODE_ENV=production
   PORT=5005
   
   # MongoDB Atlas (get from your MongoDB Atlas dashboard)
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT (generate a secure random string)
   JWT_SECRET=your_secure_jwt_secret
   
   # Email (Gmail App Password)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   
   # Resend Email (optional - for better deliverability)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=Your App <no-reply@yourdomain.com>
   
   # AI Chatbot (get from Google AI Studio)
   GEMINI_API_KEY=your_gemini_api_key
   AI_PROVIDER=gemini
   
   # Google Meet (get from Google Cloud Console)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_refresh_token
   GOOGLE_REDIRECT_URI=https://healthsync-backend.onrender.com/api/google/callback
   
   # Stripe (get from Stripe Dashboard)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # CORS & URLs
   CORS_ORIGIN=https://your-frontend.vercel.app
   FRONTEND_URL=https://your-frontend.vercel.app
   BACKEND_URL=https://healthsync-backend.onrender.com
   
   # Timezone
   TIMEZONE=Asia/Kolkata
   ```

5. **Deploy**: Click "Create Web Service"

6. **Note your backend URL**: e.g., `https://healthsync-backend.onrender.com`

#### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**: Go to https://vercel.com and sign up

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`

3. **Configure Build Settings**:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Add Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com
   REACT_APP_BACKEND_URL=https://your-backend.onrender.com
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   REACT_APP_USE_STRIPE_PAYMENTS=false
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   GENERATE_SOURCEMAP=false
   CI=false
   DISABLE_ESLINT_PLUGIN=true
   ```

5. **Deploy**: Click "Deploy"

---

### Option 2: Railway (Full Stack)

1. **Create Railway Account**: https://railway.app

2. **New Project** → "Deploy from GitHub"

3. **Add Backend Service**:
   - Select repository
   - Set root directory: `backend`
   - Add environment variables (same as Render)

4. **Add Frontend Service**:
   - Add another service from same repo
   - Set root directory: `frontend`
   - Add environment variables

5. **Generate Domains** for both services

---

### Option 3: DigitalOcean App Platform

1. **Create DigitalOcean Account**: https://digitalocean.com

2. **Create App**:
   - Source: GitHub
   - Select repository

3. **Configure Components**:
   - Backend: Web Service, root `backend`
   - Frontend: Static Site, root `frontend`

4. **Add Environment Variables**

5. **Deploy**

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] MongoDB Atlas cluster created and IP whitelist set to `0.0.0.0/0`
- [ ] All environment variables configured
- [ ] Google OAuth redirect URI updated for production
- [ ] CORS_ORIGIN set to frontend production URL
- [ ] Email credentials verified

### Frontend
- [ ] `REACT_APP_API_URL` points to production backend
- [ ] Build tested locally with `npm run build`
- [ ] No hardcoded localhost URLs

---

## 🔧 Post-Deployment Steps

### 1. Update Google OAuth Redirect URI
Go to Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
Add production redirect URI:
```
https://your-backend-url.onrender.com/api/google/callback
```

### 2. Test All Features
- [ ] User registration/login
- [ ] Admin login
- [ ] Clinic login
- [ ] Appointment booking
- [ ] Online consultation (Google Meet)
- [ ] AI Chatbot
- [ ] Email notifications

### 3. Create Production Admin
Run this in your backend (or use the API):
```bash
# SSH into your server or use Render Shell
node create-admin-production.js
```

---

## 🔒 Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong JWT secrets** in production
3. **Enable HTTPS** (automatic on Render/Vercel)
4. **Set proper CORS origins** - Don't use `*` in production
5. **Rotate API keys** periodically

---

## 📊 Monitoring

### Render
- View logs in Dashboard → Logs
- Set up health checks at `/api/health`

### Vercel
- View deployment logs
- Analytics available in dashboard

---

## 🆘 Troubleshooting

### Backend not starting
- Check logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### CORS errors
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check for trailing slashes

### Google Meet not working
- Update `GOOGLE_REDIRECT_URI` to production URL
- Re-authorize OAuth if needed

### Database connection issues
- Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access
- Verify connection string format

---

## 📞 Support

For issues, check:
1. Render/Vercel deployment logs
2. Browser console for frontend errors
3. Network tab for API errors
