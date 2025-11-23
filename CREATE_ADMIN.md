# 🔑 Create Admin User in MongoDB Atlas

## Problem
Your MongoDB Atlas database is empty, so `admin@hospital.com` login shows "Invalid admin credentials".

## Solution
Create the admin user using the `seedAdmin.js` script.

---

## ✅ Step-by-Step Instructions

### 1. Set Up MongoDB Connection String

Create or update `backend/.env` file with your MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

**Important:**
- Use the **same connection string** you set in Render
- Replace `username`, `password`, and `cluster0.xxxxx` with your actual values
- Make sure the database name is `doctor_appointment`
- **Don't commit this file** (it's in .gitignore)

### 2. Run the Seed Script

Open terminal in your project root and run:

```bash
cd backend
node seedAdmin.js
```

### 3. Expected Output

**If admin doesn't exist:**
```
Connecting to MongoDB...
Connection string: mongodb+srv://username:****@cluster0.xxxxx.mongodb.net/...
✅ Connected to MongoDB
Hashing password...
✅ Admin created successfully!
   Email: admin@hospital.com
   Password: Admin@123
   Role: admin

🎉 You can now log in with these credentials!
```

**If admin already exists:**
```
⚠️  Admin already exists: admin@hospital.com
   You can use this account to log in.
```

### 4. Test Login

Go to your deployed frontend:
- **URL**: `https://your-app.vercel.app`
- **Email**: `admin@hospital.com`
- **Password**: `Admin@123`

Click "Admin Login" → Should work! 🎉

---

## 🔧 Troubleshooting

### Error: "Cannot find module './models/User'"
**Solution**: Make sure you're running the script from the `backend` folder:
```bash
cd backend
node seedAdmin.js
```

### Error: "MongoDB authentication failed"
**Solution**: 
- Check your connection string in `backend/.env`
- Verify username and password are correct
- URL-encode password if it contains special characters

### Error: "Connection timeout"
**Solution**:
- Check MongoDB Atlas Network Access
- Make sure `0.0.0.0/0` is whitelisted
- Wait 1-2 minutes after changing network settings

### Error: "E11000 duplicate key"
**Solution**: Admin already exists! You can use it to log in.

---

## 📝 Admin Credentials

After running the script, use these to log in:

- **Email**: `admin@hospital.com`
- **Password**: `Admin@123`
- **Role**: `admin`

---

## 🔄 Run Again?

If you need to reset the admin password or create it again:

1. Delete the admin user from MongoDB Atlas (optional)
2. Run `node seedAdmin.js` again

Or manually update the password in MongoDB Atlas (but you'll need to hash it first).

---

## ✅ Verification

After creating the admin:

1. ✅ Run `node seedAdmin.js` - should show "Admin created"
2. ✅ Go to your frontend login page
3. ✅ Click "Admin Login"
4. ✅ Enter: `admin@hospital.com` / `Admin@123`
5. ✅ Should successfully log in! 🎉

---

**That's it! Your admin user is now ready to use.**

