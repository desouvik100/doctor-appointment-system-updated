# Mobile Google Sign-In Configuration Guide

## Current Status
✅ Web Client ID is correctly configured in `frontend/src/mobile/googleAuth.js`
✅ Client ID: `477733520458-juhlgonpioe7tcjenocei4pcco4h9204.apps.googleusercontent.com`

## What's Already Done
1. The mobile app uses the correct Web OAuth Client ID
2. The app has both native and browser-based OAuth fallback
3. Firebase configuration is in place

## Steps to Complete Mobile Google Sign-In Setup

### 1. Update google-services.json (If you have a new one)
If you downloaded a new `google-services.json` file from Firebase Console:

1. Copy the new file from your Downloads folder
2. Replace the existing file at: `mobile/android/app/google-services.json`
3. Make sure it has the correct `package_name`: `com.healthsync.app`

### 2. Configure Google Cloud Console for Android
Go to: https://console.cloud.google.com/apis/credentials

**Add Android OAuth Client:**
1. Click "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: "Android"
3. Name: "HealthSync Android"
4. Package name: `com.healthsync.app`
5. SHA-1 certificate fingerprint: (Get this from your Android keystore)

**To get SHA-1 fingerprint:**
```bash
# For debug keystore (development)
cd mobile/android
./gradlew signingReport

# Or using keytool
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 3. Verify Authorized Redirect URIs
In Google Cloud Console, make sure these are added:
- `http://localhost:5005/api/auth/google/callback`
- `https://doctor-appointment-system-updated.onrender.com/api/auth/google/callback`

### 4. Test Mobile Google Sign-In

**Build and run the mobile app:**
```bash
cd mobile
npm install
npx cap sync android
npx cap open android
```

Then in Android Studio:
1. Build and run the app
2. Try Google Sign-In
3. Check logs for any errors

## Current Configuration Files

### frontend/src/mobile/googleAuth.js
- ✅ Web Client ID: `477733520458-juhlgonpioe7tcjenocei4pcco4h9204.apps.googleusercontent.com`
- ✅ Native auth with browser fallback
- ✅ Proper error handling

### mobile/android/app/google-services.json
- Project ID: `healthsync-611cc`
- Package: `com.healthsync.app`
- Firebase API Key: `AIzaSyDTOvAUYx4DKxLTFf7WQ0XS5ITmWJJMqYk`

## Troubleshooting

### If Google Sign-In fails on mobile:
1. Check that SHA-1 fingerprint is added to Google Cloud Console
2. Verify package name matches: `com.healthsync.app`
3. Make sure google-services.json is up to date
4. Check Android logs: `adb logcat | grep -i google`

### Common Errors:
- **Error 10**: SHA-1 fingerprint not configured
- **Error 12501**: User cancelled or configuration mismatch
- **Error 7**: Network error

## Next Steps
1. If you have a new google-services.json, replace the current one
2. Get SHA-1 fingerprint and add to Google Cloud Console
3. Build and test the mobile app
4. Verify Google Sign-In works on Android device/emulator

---

**Note**: The web application Google Sign-In is already working perfectly. Mobile just needs the Android-specific OAuth client configured in Google Cloud Console.
