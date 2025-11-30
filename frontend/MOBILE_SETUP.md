# HealthSync Mobile App Setup Guide

This guide covers setting up the Capacitor mobile app for Android and iOS.

## Prerequisites

- Node.js 18+ and npm
- Android Studio (for Android builds)
- Xcode (for iOS builds - Mac only)
- Java JDK 17+ (for Android)

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Initialize Capacitor (First Time Only)

```bash
# Add Android platform
npm run cap:add:android

# Add iOS platform (Mac only)
npm run cap:add:ios
```

### 3. Build and Run

```bash
# Build React app and copy to native projects
npm run mobile:build

# Open in Android Studio
npm run cap:open:android

# Or open in Xcode (Mac only)
npm run cap:open:ios
```

### 4. Run on Device/Emulator

From Android Studio or Xcode, select your device/emulator and click Run.

---

## Detailed Setup

### Android Setup

1. **Install Android Studio**: https://developer.android.com/studio

2. **Configure SDK**: Open Android Studio → SDK Manager
   - Install Android SDK Platform 33 (or latest)
   - Install Android SDK Build-Tools
   - Install Android Emulator

3. **Set Environment Variables** (Windows):
   ```
   ANDROID_HOME = C:\Users\<user>\AppData\Local\Android\Sdk
   Add to PATH: %ANDROID_HOME%\platform-tools
   ```

4. **Create Emulator**: AVD Manager → Create Virtual Device

5. **Build & Run**:
   ```bash
   npm run mobile:android
   ```

### iOS Setup (Mac Only)

1. **Install Xcode** from App Store

2. **Install CocoaPods**:
   ```bash
   sudo gem install cocoapods
   ```

3. **Build & Run**:
   ```bash
   npm run mobile:ios
   ```

4. **Configure Signing**: In Xcode, select your Team in Signing & Capabilities

---

## Firebase Push Notifications Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project "HealthSync"
3. Add Android app with package name: `com.healthsync.app`
4. Download `google-services.json`

### 2. Android Configuration

1. Copy `google-services.json` to `android/app/`

2. Update `android/build.gradle`:
   ```gradle
   buildscript {
       dependencies {
           classpath 'com.google.gms:google-services:4.4.0'
       }
   }
   ```

3. Update `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### 3. Backend Configuration

Add to `backend/.env`:
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

Get the service account JSON from Firebase Console → Project Settings → Service Accounts → Generate New Private Key

---

## Android Permissions

The following permissions are automatically added by Capacitor plugins. Verify in `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Camera (for prescriptions) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Storage (for file uploads) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Push Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## Payment Flow (Mobile)

The app uses Capacitor Browser for hosted checkout:

1. User taps "Pay" on appointment
2. App calls `POST /api/payments/create-order`
3. Backend returns Razorpay order ID
4. App opens hosted checkout page in in-app browser
5. User completes payment on Razorpay page
6. Page redirects to success URL
7. App polls backend for payment status
8. App shows confirmation and updates UI

### Usage in Components

```javascript
import { openCheckout } from '../mobile/payment';

const handlePayment = async () => {
  try {
    const result = await openCheckout(appointmentId, userId);
    
    if (result.success) {
      toast.success('Payment successful!');
      // Refresh appointment data
    } else if (result.testMode) {
      toast.success('Test mode - appointment confirmed');
    } else {
      toast.error(result.message || 'Payment failed');
    }
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

## Secure Storage

For JWT tokens, use the auth storage helper:

```javascript
import { saveUser, getUser, logout } from '../mobile/authStorage';

// Save user after login
await saveUser({ token, name, email, id });

// Get current user
const user = await getUser();

// Logout
await logout();
```

---

## Camera & File Upload

For prescription uploads:

```javascript
import { captureAndUploadPrescription } from '../mobile/camera';

const handleUpload = async () => {
  const result = await captureAndUploadPrescription(appointmentId, 'Prescription');
  
  if (result.success) {
    toast.success('Prescription uploaded');
  }
};
```

---

## Testing Checklist

### Before Release

- [ ] Login/Signup flow works
- [ ] Doctor list loads correctly
- [ ] Appointment booking works
- [ ] Payment flow completes (test mode)
- [ ] Payment verification updates appointment
- [ ] Appointment history shows paid appointments
- [ ] Push notifications received
- [ ] Camera/gallery access works
- [ ] File upload works
- [ ] Deep links handled correctly
- [ ] App works offline (graceful errors)
- [ ] Back button behavior correct
- [ ] Keyboard doesn't cover inputs

### Test on Devices

- [ ] Android emulator
- [ ] Physical Android device
- [ ] iOS simulator (Mac)
- [ ] Physical iOS device (Mac)

---

## Building for Release

### Android APK/AAB

1. **Generate Keystore** (first time):
   ```bash
   keytool -genkey -v -keystore healthsync-release.keystore -alias healthsync -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing** in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('healthsync-release.keystore')
               storePassword 'your-store-password'
               keyAlias 'healthsync'
               keyPassword 'your-key-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build Release**:
   - Open Android Studio
   - Build → Generate Signed Bundle/APK
   - Select Android App Bundle (AAB) for Play Store
   - Select your keystore and build

### iOS Build

1. Open Xcode
2. Select "Any iOS Device" as target
3. Product → Archive
4. Distribute App → App Store Connect

---

## Play Store Checklist

Before submitting to Google Play:

- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (phone & tablet)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL
- [ ] Contact email
- [ ] Content rating questionnaire completed
- [ ] Target API level 33+
- [ ] 64-bit support enabled
- [ ] App tested on multiple devices
- [ ] Payment flow tested in production mode
- [ ] All APIs use HTTPS

---

## Troubleshooting

### Build Errors

**Gradle sync failed**:
```bash
cd android
./gradlew clean
cd ..
npm run cap:sync
```

**iOS pod install failed**:
```bash
cd ios/App
pod install --repo-update
```

### Runtime Issues

**API calls failing on Android**:
- Ensure `android:usesCleartextTraffic="true"` in AndroidManifest.xml for HTTP (dev only)
- Use HTTPS in production

**Camera not working**:
- Check permissions in AndroidManifest.xml
- Request runtime permissions

**Push notifications not received**:
- Verify google-services.json is in correct location
- Check Firebase project configuration
- Ensure FCM token is registered with backend

---

## Optional: Native Payment SDK Migration

If you later want to use native Razorpay/Stripe SDKs instead of web checkout:

### Razorpay Native

1. Add Razorpay Android SDK to `android/app/build.gradle`:
   ```gradle
   implementation 'com.razorpay:checkout:1.6.33'
   ```

2. Create Capacitor plugin or use community plugin

3. Update payment.js to use native SDK when available

### Stripe Native

1. Install `@stripe/stripe-react-native`
2. Follow Stripe's native setup guide
3. Update payment flow to use native SDK

---

## Support

For issues:
1. Check console logs in Android Studio/Xcode
2. Use Chrome DevTools for web debugging: `chrome://inspect`
3. Check Capacitor docs: https://capacitorjs.com/docs
