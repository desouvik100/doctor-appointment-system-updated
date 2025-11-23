# Running the Application Locally

## Quick Start

### 1. Start Backend Server

```bash
cd backend
npm install
node server.js
```

The backend will run on `http://localhost:5001`

### 2. Start Frontend (in a new terminal)

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

---

## Environment Setup

### Backend (.env file)

Create `backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/doctor_appointment
PORT=5001
NODE_ENV=development
JWT_SECRET=your-local-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend

No `.env` file needed for local development - it will automatically use `http://localhost:5001`

---

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify port 5001 is not in use
- Check `.env` file exists

### Frontend can't connect to backend
- Verify backend is running on port 5001
- Check browser console for CORS errors
- Verify `frontend/src/api/config.js` has correct API URL

### Database connection failed
- Start MongoDB: `mongod` (or use MongoDB service)
- Verify connection string in `.env`

---

## Populate Database

After starting the backend, populate with sample data:

```bash
cd backend
node quick-populate.js
```

---

## Default Login Credentials

After populating the database:

- **Admin**: `admin@hospital.com` / `admin123`
- **Patient**: `john.doe@email.com` / `password123`
- **Receptionist**: `reception1@citygeneral.com` / `reception123`

