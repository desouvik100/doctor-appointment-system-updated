# Deployment Guide

This guide will help you deploy the Doctor Appointment System to:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas
- **Payment**: Stripe (already configured)

## Prerequisites

1. GitHub account with the repository pushed
2. Vercel account (free tier available)
3. Render account (free tier available)
4. MongoDB Atlas account (free tier available)
5. Stripe account (for payments)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user:
   - Go to Database Access → Add New Database User
   - Username: `doctor-appointment-user` (or your choice)
   - Password: Generate a secure password
4. Whitelist IP addresses:
   - Go to Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
5. Get connection string:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority`

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `desouvik100/doctor-appointment-system-updated`
4. Configure the service:
   - **Name**: `doctor-appointment-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

### 2.2 Set Environment Variables on Render

Go to Environment section and add:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=10000
STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
STRIPE_PUBLISHABLE_KEY=pk_test_... (your Stripe publishable key)
```

**Important**: 
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Generate a strong `JWT_SECRET` (use a random string generator)
- Add your Stripe keys if using payments

### 2.3 Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://doctor-appointment-backend.onrender.com`)

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `desouvik100/doctor-appointment-system-updated`
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### 3.2 Set Environment Variables on Vercel

Go to Settings → Environment Variables and add:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

Replace `https://your-backend-url.onrender.com` with your actual Render backend URL.

### 3.3 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be live at `https://your-app-name.vercel.app`

---

## Step 4: Update CORS Settings

After deployment, update your backend CORS to allow your Vercel domain:

1. Go to Render → Your Service → Environment
2. Add:
   ```
   CORS_ORIGIN=https://your-app-name.vercel.app
   ```
3. Update `backend/server.js` to use this:

```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## Step 5: Populate Database

After deployment, populate your MongoDB Atlas database:

### Option 1: Using Render Shell

1. Go to Render → Your Service → Shell
2. Run:
   ```bash
   cd backend
   node quick-populate.js
   ```

### Option 2: Using Local Machine

1. Update your local `.env` with MongoDB Atlas connection string
2. Run:
   ```bash
   cd backend
   node quick-populate.js
   ```

---

## Step 6: Test Deployment

1. Visit your Vercel frontend URL
2. Test login with:
   - **Admin**: `admin@hospital.com` / `admin123`
   - **Patient**: `john.doe@email.com` / `password123`
   - **Receptionist**: `reception1@citygeneral.com` / `reception123`

---

## Environment Variables Summary

### Backend (Render)
- `NODE_ENV=production`
- `MONGODB_URI` (MongoDB Atlas connection string)
- `JWT_SECRET` (random secret key)
- `PORT=10000` (Render uses this port)
- `STRIPE_SECRET_KEY` (if using payments)
- `STRIPE_PUBLISHABLE_KEY` (if using payments)
- `CORS_ORIGIN` (your Vercel frontend URL)

### Frontend (Vercel)
- `REACT_APP_API_URL` (your Render backend URL)

---

## Troubleshooting

### Backend Issues

1. **Build fails**: Check that all dependencies are in `package.json`
2. **Database connection fails**: Verify MongoDB Atlas IP whitelist includes Render IPs
3. **CORS errors**: Update `CORS_ORIGIN` environment variable

### Frontend Issues

1. **API calls fail**: Verify `REACT_APP_API_URL` is set correctly
2. **Build fails**: Check for any console errors in Vercel build logs
3. **404 errors**: Ensure `vercel.json` is configured correctly

---

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database populated with sample data
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Test all login types (Admin, Patient, Receptionist)
- [ ] Test CRUD operations
- [ ] Test appointment booking
- [ ] Verify payment integration (if applicable)

---

## Support

If you encounter issues:
1. Check Render logs: Render Dashboard → Your Service → Logs
2. Check Vercel logs: Vercel Dashboard → Your Project → Deployments → View Function Logs
3. Check MongoDB Atlas logs: Atlas Dashboard → Monitoring

---

## URLs After Deployment

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`
- **API Health Check**: `https://your-backend-name.onrender.com/api/health`

