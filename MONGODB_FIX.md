# Fix MongoDB Atlas Connection

Your backend is running but can't connect to MongoDB. Here's how to fix it:

---

## Step 1: Check MongoDB Atlas Cluster Status

1. Go to: https://cloud.mongodb.com
2. Log in with your account
3. Click **Cluster0**
4. Check the status:
   - ✅ **Green** = Running (Good)
   - ⏸️ **Paused** = Cluster is paused (Need to resume)
   - ❌ **Red** = Error (Need to investigate)

### If Paused:
1. Click **Resume**
2. Wait 2-3 minutes for it to start
3. Your backend will automatically connect

---

## Step 2: Verify Network Access

1. Go to: https://cloud.mongodb.com
2. Click **Network Access** (left sidebar)
3. Check your IP whitelist:
   - Should see `0.0.0.0/0` (allows all IPs)
   - Or your specific IP addresses

### If Not Whitelisted:
1. Click **Add IP Address**
2. Enter: `0.0.0.0/0`
3. Click **Confirm**

---

## Step 3: Test Connection String

Your connection string should be:
```
mongodb+srv://desouvik100:Souvik1234@cluster0.qv72ila.mongodb.net/doctor_appointment?retryWrites=true&w=majority&appName=Cluster0
```

Make sure:
- ✅ Username: `desouvik100`
- ✅ Password: `Souvik1234`
- ✅ Cluster: `cluster0.qv72ila.mongodb.net`
- ✅ Database: `doctor_appointment`

---

## Step 4: Check Render Environment Variables

1. Go to: https://dashboard.render.com
2. Click your service
3. Click **Environment**
4. Verify `MONGODB_URI` is set correctly:
   ```
   MONGODB_URI=mongodb+srv://desouvik100:Souvik1234@cluster0.qv72ila.mongodb.net/doctor_appointment?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## Step 5: Redeploy on Render

1. Go to: https://dashboard.render.com
2. Click your service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait 2-3 minutes
5. Check: https://doctor-appointment-system-updated.onrender.com/api/health

---

## Common Issues & Solutions

### Issue: "Server selection timed out"
**Solution:** 
- Check if cluster is paused (Step 1)
- Check if IP is whitelisted (Step 2)
- Wait 5 minutes and try again

### Issue: "Invalid credentials"
**Solution:**
- Verify username and password in connection string
- Go to MongoDB Atlas → Database Access
- Reset password if needed

### Issue: "Connection refused"
**Solution:**
- Check if cluster is running
- Check network access whitelist
- Try connecting from MongoDB Compass to test

---

## Quick Checklist

- [ ] MongoDB Atlas cluster is **running** (not paused)
- [ ] IP whitelist includes `0.0.0.0/0` or your IP
- [ ] Connection string has database name: `/doctor_appointment`
- [ ] Render environment variables are set
- [ ] Render service has been redeployed

---

## If Still Not Working

Try this alternative approach:

### Option A: Use MongoDB Atlas Connection String from Compass
1. Go to MongoDB Atlas
2. Click **Connect** → **Compass**
3. Copy the connection string
4. Use that in your `.env`

### Option B: Create New Database User
1. Go to MongoDB Atlas → **Database Access**
2. Click **Add New Database User**
3. Create new user with strong password
4. Update connection string with new credentials

### Option C: Check MongoDB Atlas Logs
1. Go to MongoDB Atlas
2. Click **Logs** (left sidebar)
3. Look for connection errors
4. Check if there are any alerts

---

**After fixing, your backend will connect and mobile app will work!**
