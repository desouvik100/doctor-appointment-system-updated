# Google Sign-In Android Audit
**Date:** 2026-06-01

## Root Cause: DEVELOPER_ERROR (Code 10)

### What DEVELOPER_ERROR Means
Error code 10 is Google's error for "the signing certificate SHA-1 fingerprint is not registered for this package in Google Cloud Console". It is NOT a code bug — it requires a manual action in Google Cloud Console.

### Debug SHA-1 (Confirmed)
```
SHA1:   0E:D4:51:34:DB:C9:9C:AE:90:F4:84:D4:CB:10:2C:F0:BF:BE:65:15
SHA256: 39:5B:C2:B7:7A:2A:3A:26:2F:99:12:F0:EB:75:F0:34:8F:84:9E:77:6E:22:E7:C3:26:A0:68:38:22:DD:3D:BC
```

### Current State

| Item | Value | Status |
|------|-------|--------|
| Package name (build.gradle) | `com.healthsync.app` | ✅ |
| Package name (google-services.json) | `com.healthsync.app` | ✅ |
| Web Client ID (env.js) | `703204659246-q2jpikuoqkjsmsvbsrtfp3bcoush4h3r` | ✅ |
| Google project number | `703204659246` | ✅ |
| Android OAuth Client in JSON | ❌ Not present (only Web client type 3) | **Missing** |
| SHA-1 fingerprint registered | ❓ SHA-1 obtained: `0E:D4:51:34:DB:C9:9C:AE:90:F4:84:D4:CB:10:2C:F0:BF:BE:65:15` — **register in Firebase** |

### Fix Required

**You already have the SHA-1. Follow these exact steps:**

**Step 1 — Firebase Console (Easiest)**
1. Go to https://console.firebase.google.com/
2. Select project: **healthsync-611cc**
3. Click gear icon ⚙️ → **Project Settings**
4. Scroll to **"Your apps"** → find `com.healthsync.app`
5. Click **"Add fingerprint"**
6. Paste the SHA-1:
   ```
   0E:D4:51:34:DB:C9:9C:AE:90:F4:84:D4:CB:10:2C:F0:BF:BE:65:15
   ```
7. Click **Save**
8. Click **"Download google-services.json"** (button at top of page)
9. Replace `mobile/android/app/google-services.json` with the downloaded file
10. Rebuild the APK: `cd mobile/android && ./gradlew assembleDebug`

**Step 2 — (Optional) Also add to Google Cloud Console**
1. Go to https://console.cloud.google.com/
2. Project: **healthsync-611cc** (number: 703204659246)
3. APIs & Services → Credentials
4. Create Credentials → OAuth 2.0 Client ID → **Android**
5. Package name: `com.healthsync.app`
6. SHA-1: `0E:D4:51:34:DB:C9:9C:AE:90:F4:84:D4:CB:10:2C:F0:BF:BE:65:15`
7. Create → download updated `google-services.json` → replace file → rebuild

### Code Status: ✅ No Changes Needed

The code is correct:
- `configureGoogleSignIn()` uses `webClientId` — correct for Android native sign-in
- `signInWithGoogle()` calls `GoogleSignin.hasPlayServices()` before sign-in
- Error code 10 is already handled with a descriptive message
- Backend `POST /auth/google-signin` is implemented and working

### After Fix Expected Flow

```
User taps "Sign in with Google"
→ Google Account picker opens ✅
→ User selects account ✅
→ Google returns idToken ✅
→ POST /auth/google-signin {email, name, googleId} ✅
→ Backend creates/finds user in MongoDB ✅
→ Returns JWT + refreshToken ✅
→ App saves token to Keychain ✅
→ User logged in ✅
```
