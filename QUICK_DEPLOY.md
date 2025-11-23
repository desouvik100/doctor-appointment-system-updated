# Quick Deployment Guide

## 🚀 Fast Track Deployment

### 1. MongoDB Atlas Setup (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Create database user (Database Access)
4. Whitelist IP: `0.0.0.0/0` (Network Access)
5. Get connection string (Connect → Connect your application)
6. Copy the connection string

---

### 2. Deploy Backend to Render (10 minutes)

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo: `desouvik100/doctor-appointment-system-updated`
4. Settings:
   - **Name**: `doctor-appointment-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: `Node`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<paste-your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-random-secret-key>
   PORT=10000
   CORS_ORIGIN=https://your-app-name.vercel.app
   ```

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL: `https://doctor-appointment-backend.onrender.com`

---

### 3. Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com/new
2. Import GitHub repo: `desouvik100/doctor-appointment-system-updated`
3. Settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://doctor-appointment-backend.onrender.com
   ```
   (Replace with your actual Render backend URL)

5. Click "Deploy"
6. Wait for deployment (2-3 minutes)
7. Copy your frontend URL: `https://your-app-name.vercel.app`

---

### 4. Update CORS (2 minutes)

1. Go back to Render dashboard
2. Your Service → Environment
3. Update `CORS_ORIGIN` with your Vercel URL:
   ```
   CORS_ORIGIN=https://your-app-name.vercel.app
   ```
4. Service will auto-redeploy

---

### 5. Populate Database (2 minutes)

**Option A: Using Render Shell**
1. Render Dashboard → Your Service → Shell
2. Run:
   ```bash
   cd backend
   node quick-populate.js
   ```

**Option B: Using Local Machine**
1. Create `backend/.env`:
   ```
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   ```
2. Run:
   ```bash
   cd backend
   npm install
   node quick-populate.js
   ```

---

### 6. Test Your Deployment ✅

Visit your Vercel URL and test:
- Admin Login: `admin@hospital.com` / `admin123`
- Patient Login: `john.doe@email.com` / `password123`
- Receptionist Login: `reception1@citygeneral.com` / `reception123`

---

## 📋 Environment Variables Checklist

### Render (Backend)
- ✅ `NODE_ENV=production`
- ✅ `MONGODB_URI` (MongoDB Atlas connection string)
- ✅ `JWT_SECRET` (random secret)
- ✅ `PORT=10000`
- ✅ `CORS_ORIGIN` (your Vercel URL)

### Vercel (Frontend)
- ✅ `REACT_APP_API_URL` (your Render backend URL)

---

## 🔗 Your URLs

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://doctor-appointment-backend.onrender.com`
- **Health Check**: `https://doctor-appointment-backend.onrender.com/api/health`

---

## ⚠️ Important Notes

1. **Free Tier Limitations**:
   - Render: Services spin down after 15 min inactivity (first request may be slow)
   - Vercel: Unlimited deployments
   - MongoDB Atlas: 512MB storage

2. **First Request**: Render free tier services take ~30 seconds to wake up if inactive

3. **Stripe Keys**: Add your Stripe keys to Render environment variables if using payments

---

## 🆘 Troubleshooting

**Backend not responding?**
- Check Render logs
- Verify MongoDB Atlas IP whitelist includes Render IPs
- Check environment variables are set

**Frontend can't connect to backend?**
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS_ORIGIN matches your Vercel URL
- Check browser console for errors

**Database connection failed?**
- Verify MongoDB Atlas connection string
- Check IP whitelist includes `0.0.0.0/0`
- Verify database user credentials

---

## ✅ Done!

Your app is now live! 🎉

