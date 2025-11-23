# ⚡ Quick Admin Setup

## 🎯 Goal
Create admin user: `admin@hospital.com` / `Admin@123`

## 🚀 Quick Steps

### 1. Set MongoDB Connection (One Time)

Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```
*(Use the same connection string from Render)*

### 2. Run Script

```bash
cd backend
npm run seed:admin
```

Or:
```bash
cd backend
node seedAdmin.js
```

### 3. Login

Go to your frontend → Admin Login:
- **Email**: `admin@hospital.com`
- **Password**: `Admin@123`

✅ Done!

---

## 📋 Full Instructions

See `CREATE_ADMIN.md` for detailed steps and troubleshooting.

