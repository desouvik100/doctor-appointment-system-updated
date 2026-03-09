# Google Sign-In Error 401: invalid_client - FIX GUIDE

## Problem
The Google Client ID in your `.env` files doesn't match what's registered in Google Cloud Console.

Error: "Access blocked: Authorization Error - Error 401: invalid_client"

## Solution - Get the Correct Client ID

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account (desouvik2018@gmail.com)

### Step 2: Find Your OAuth 2.0 Client ID
1. Look for "OAuth 2.0 Client IDs" section
2. You should see a client named something like "Web client" or "HealthSync Web"
3. Click on it to open the details

### Step 3: Copy the COMPLETE Client ID
The Client ID should look like:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

**IMPORTANT**: 
- It's a LONG string (around 70+ characters)
- It ends with `.apps.googleusercontent.com`
- Copy the ENTIRE string without any spaces or line breaks

### Step 4: Verify Authorized JavaScript Origins
While you're in the OAuth client settings, make sure these are added:
- `http://localhost:3001`
- `http://localhost:5005`
- `http://127.0.0.1:3001`

### Step 5: Update Your .env Files

Once you have the correct Client ID, I'll update both files:

**frontend/.env**:
```
REACT_APP_GOOGLE_CLIENT_ID=YOUR_COMPLETE_CLIENT_ID_HERE
```

**backend/.env**:
```
GOOGLE_CLIENT_ID=YOUR_COMPLETE_CLIENT_ID_HERE
```

### Step 6: Restart Servers
After updating, I'll restart both frontend and backend servers.

---

## Current Issue
Your current Client IDs are incomplete:
- Frontend: `477733520458-juhgonpjoe7tcjenoce4pccoth9204hq.apps.googleusercontent.com`
- Backend: `477733520458-juhgonpjoe7tcjenoce4pccoth9204.apps.googleusercontent.com`

These don't match and appear truncated. The real Client ID should be longer.

---

## Alternative: Disable Google Sign-In Temporarily

If you want to launch without Google Sign-In for now, I can:
1. Hide the "Continue with Google" button
2. Keep only Email/Password login (which works perfectly)
3. Add Google Sign-In later when you have the correct credentials

**What would you like to do?**
1. Get the correct Client ID from Google Cloud Console (I'll wait for you to provide it)
2. Disable Google Sign-In for now and use Email/Password only
