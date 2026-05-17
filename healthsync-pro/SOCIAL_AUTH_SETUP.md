# Social Authentication Setup Guide

This guide explains how to set up Google, Facebook, and Apple Sign-In for the HealthSync mobile app.

## ✅ Packages Already Installed

The following packages have been installed:
- `@react-native-google-signin/google-signin`
- `react-native-fbsdk-next`
- `@invertase/react-native-apple-authentication`

## 🔧 Configuration Required

### 1. Google Sign-In Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named "HealthSync"
3. Enable "Google Sign-In API"

#### Step 2: Create OAuth Credentials
1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Create a **Web application** client (for backend verification)
   - Copy the Client ID - this is your `GOOGLE_WEB_CLIENT_ID`
3. Create an **Android** client
   - Package name: `com.healthsync`
   - Get SHA-1 fingerprint:
     ```bash
     cd mobile/android && ./gradlew signingReport
     ```
4. Download `google-services.json` and replace `mobile/android/app/google-services.json`

#### Step 3: Update Configuration
Edit `mobile/src/config/env.js`:
```javascript
export const GOOGLE_WEB_CLIENT_ID = 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com';
```

---

### 2. Facebook Sign-In Setup

#### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → Select "Consumer" type
3. Add "Facebook Login" product
4. Note your **App ID** and **Client Token**

#### Step 2: Update Android Configuration
Edit `mobile/android/app/src/main/res/values/strings.xml`:
```xml
<string name="facebook_app_id">YOUR_ACTUAL_APP_ID</string>
<string name="fb_login_protocol_scheme">fbYOUR_ACTUAL_APP_ID</string>
<string name="facebook_client_token">YOUR_ACTUAL_CLIENT_TOKEN</string>
```

#### Step 3: Configure Facebook Dashboard
1. Add Android platform in Facebook App Settings
2. Package name: `com.healthsync`
3. Add your key hash (get from `keytool` command)

---

### 3. Apple Sign-In Setup (iOS Only)

#### Xcode Configuration
1. Open `mobile/ios/HealthSync.xcworkspace` in Xcode
2. Go to **Signing & Capabilities**
3. Click **+ Capability** → Add **Sign in with Apple**

#### Apple Developer Portal
1. Go to [Apple Developer](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles → Identifiers
3. Select your App ID → Enable "Sign in with Apple"

---

## 📁 Files Modified

| File | Purpose |
|------|---------|
| `mobile/App.js` | Initializes Google Sign-In on app start |
| `mobile/src/services/socialAuthService.js` | Social auth service with all providers |
| `mobile/src/screens/auth/LoginScreen.js` | Social login buttons with handlers |
| `mobile/src/screens/auth/RegisterScreen.js` | Social signup buttons with handlers |
| `mobile/src/config/env.js` | OAuth configuration |
| `mobile/android/app/build.gradle` | Google services plugin |
| `mobile/android/build.gradle` | Google services classpath |
| `mobile/android/app/src/main/AndroidManifest.xml` | Facebook SDK config |
| `mobile/android/app/src/main/res/values/strings.xml` | Facebook credentials |
| `mobile/android/app/google-services.json` | Google services config (replace this) |
| `backend/routes/authRoutes.js` | Social auth API endpoints |
| `backend/models/User.js` | Added facebookId, appleId fields |

---

## 🧪 Testing

After configuration:

1. **Build the app:**
   ```bash
   cd mobile
   npx react-native run-android
   ```

2. **Test each provider:**
   - Tap **G** button → Google Sign-In
   - Tap **f** button → Facebook Sign-In
   - Tap **🍎** button → Apple Sign-In (iOS only)

---

## 🔍 Troubleshooting

### Google Sign-In Issues
- **Error 10**: SHA-1 fingerprint mismatch - regenerate and update in Google Console
- **Error 12500**: Check `google-services.json` is correct
- **DEVELOPER_ERROR**: Web Client ID is wrong

### Facebook Sign-In Issues
- **App not set up**: Enable Facebook Login in app dashboard
- **Invalid key hash**: Add debug key hash to Facebook app settings

### Apple Sign-In Issues
- Only works on iOS 13+ real devices
- Check Apple Developer account has capability enabled
