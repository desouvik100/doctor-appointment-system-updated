# MongoDB Atlas Connection Fix for Render

## Problem
Backend shows `"database": "Disconnected"` when checking `/api/health`

## Solution Steps

### 1. Verify MongoDB Atlas Connection String

Your connection string should look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

**Important:**
- Replace `<username>` with your MongoDB Atlas database user
- Replace `<password>` with your actual password (URL-encoded if it contains special characters)
- Replace `cluster0.xxxxx` with your actual cluster name
- The database name `doctor_appointment` should match your database

### 2. Check Render Environment Variables

Go to Render Dashboard → Your Service → Environment

Verify these are set:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

**Common Issues:**
- ❌ Password contains special characters (like `@`, `#`, `%`) - need to URL-encode them
- ❌ Missing database name in connection string
- ❌ Wrong username or password
- ❌ Connection string has extra spaces

### 3. Check MongoDB Atlas Network Access

1. Go to MongoDB Atlas Dashboard
2. Click **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere** (0.0.0.0/0)
   - OR add Render's IP ranges (but allowing anywhere is easier for now)
5. Click **Confirm**

**Important:** It may take 1-2 minutes for network access changes to take effect.

### 4. Check MongoDB Atlas Database User

1. Go to MongoDB Atlas Dashboard
2. Click **Database Access** (left sidebar)
3. Verify your database user exists and has:
   - **Read and write to any database** permission (or at least to `doctor_appointment`)
   - User is **Active**

### 5. URL-Encode Password (if needed)

If your password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

**Example:**
- Password: `MyP@ss#123`
- URL-encoded: `MyP%40ss%23123`
- Connection string: `mongodb+srv://username:MyP%40ss%23123@cluster0.xxxxx.mongodb.net/...`

### 6. Test Connection String Locally

Test your connection string locally first:

Create `backend/test-connection.js`:
```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB Connection Error:', error.message);
  process.exit(1);
});
```

Run:
```bash
cd backend
node test-connection.js
```

### 7. Check Render Logs

1. Go to Render Dashboard → Your Service → Logs
2. Look for MongoDB connection errors
3. Common errors:
   - `Authentication failed` → Wrong username/password
   - `IP not whitelisted` → Network access issue
   - `Server selection timed out` → Network access or connection string issue

### 8. Update Render Environment Variable

1. Go to Render Dashboard → Your Service → Environment
2. Update `MONGODB_URI` with correct connection string
3. Click **Save Changes**
4. Service will automatically redeploy

### 9. Verify After Redeploy

Wait for redeploy to complete, then check:
```
https://your-backend-url.onrender.com/api/health
```

Should show:
```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "..."
}
```

---

## Quick Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] Database user exists and is active
- [ ] Network Access allows 0.0.0.0/0 (or Render IPs)
- [ ] Connection string is correct in Render environment variables
- [ ] Password is URL-encoded if it contains special characters
- [ ] Connection string includes database name
- [ ] Render service has been redeployed after updating MONGODB_URI

---

## Still Not Working?

1. **Check Render Logs** for specific error messages
2. **Test connection string locally** using the test script above
3. **Create a new database user** in MongoDB Atlas with a simple password
4. **Verify cluster is not paused** (free tier clusters can auto-pause)

---

## Example Correct Connection String

```
mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

**Note:** Replace all parts with your actual values!

