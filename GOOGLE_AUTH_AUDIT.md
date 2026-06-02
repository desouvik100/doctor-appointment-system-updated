# Google Sign-In Android Audit
**Date:** 2026-06-01

## Root Cause: DEVELOPER_ERROR (Code 10)

### What DEVELOPER_ERROR Means
Error code 10 is Google's error for "the signing certificate SHA-1 fingerprint is not registered for this package in Google Cloud Console". It is NOT a code bug — it requires a manual action in Google Cloud Console.

### Current State

| Item | Value | Status |
|------|-------|--------|
| Package name (build.gradle) | `com.healthsync.app` | ✅ |
| Package name (google-services.json) | `com.healthsync.app` | ✅ |
| Web Client ID (env.js) | `703204659246-q2jpikuoqkjsmsvbsrtfp3bcoush4h3r` | ✅ |
| Google project number | `703204659246` | ✅ |
| Android OAuth Client in JSON | ❌ Not present (only Web client type 3) | **Missing** |
| SHA-1 fingerprint registered | ❓ Cannot verify without Google Cloud access | **Must check** |

### Fix Required

**Step 1: Get your debug SHA-1 fingerprint**
```bash
# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Windows CMD
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Step 2: Google Cloud Console**
1. Go to https://console.cloud.google.com/
2. Select project: `healthsync-611cc`
3. Go to APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: **Android**
6. Package name: `com.healthsync.app`
7. SHA-1: [paste from Step 1]
8. Click Create

**Step 3: Download google-services.json**
- After creating the Android client, download the updated `google-services.json`
- Replace `mobile/android/app/google-services.json`
- The new file will have an OAuth client with `client_type: 1` (Android)

**Step 4: Rebuild APK**
- Clean and rebuild the Android app
- The debug build will now authenticate correctly

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
