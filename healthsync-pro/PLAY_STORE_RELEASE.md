# HealthSync - Google Play Store Release Guide

## Prerequisites Completed ✅

1. **Release Keystore Created**: `android/app/healthsync-release.keystore`
2. **Keystore Properties**: `android/keystore.properties`
3. **ProGuard Rules**: `android/app/proguard-rules.pro`
4. **Build Configuration**: Updated `android/app/build.gradle`

## Build Release APK/AAB

### Option 1: Build AAB (Recommended for Play Store)

```bash
cd mobile/android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Option 2: Build APK

```bash
cd mobile/android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

## Before Uploading to Play Store

### 1. Update Version Numbers

Edit `android/app/build.gradle`:
```gradle
versionCode 1        // Increment for each release
versionName "1.0.0"  // User-visible version
```

### 2. App Icons

Replace placeholder icons in:
- `android/app/src/main/res/mipmap-hdpi/`
- `android/app/src/main/res/mipmap-mdpi/`
- `android/app/src/main/res/mipmap-xhdpi/`
- `android/app/src/main/res/mipmap-xxhdpi/`
- `android/app/src/main/res/mipmap-xxxhdpi/`

Icon sizes:
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

### 3. Feature Graphic & Screenshots

Prepare for Play Store listing:
- Feature Graphic: 1024x500 px
- Screenshots: At least 2 (phone), recommended 8
- Phone screenshots: 16:9 or 9:16 aspect ratio

## Google Play Console Setup

### 1. Create Developer Account
- Go to: https://play.google.com/console
- Pay $25 one-time registration fee

### 2. Create New App
- Click "Create app"
- App name: HealthSync
- Default language: English
- App or game: App
- Free or paid: Free

### 3. Store Listing

Fill in:
- **Short description** (80 chars): "Book doctor appointments, manage health records & get reminders"
- **Full description** (4000 chars): Detailed app features
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: Phone & tablet

### 4. App Content

Complete all sections:
- Privacy policy URL: `https://healthsyncpro.in/privacy`
- App access: All functionality available without restrictions
- Ads: Does not contain ads
- Content rating: Complete questionnaire
- Target audience: 18+
- News apps: Not a news app
- COVID-19 apps: Healthcare app
- Data safety: Complete data collection form

### 5. Release Management

1. Go to **Production** → **Create new release**
2. Upload your `.aab` file
3. Add release notes
4. Review and roll out

## Keystore Backup ⚠️ IMPORTANT

**BACKUP YOUR KEYSTORE FILE!**

Store securely:
- `android/app/healthsync-release.keystore`
- `android/keystore.properties`

If you lose the keystore, you cannot update your app on Play Store!

Recommended backup locations:
- Encrypted cloud storage
- Password manager
- Secure USB drive

## Keystore Details

```
Keystore: healthsync-release.keystore
Alias: healthsync
Password: healthsync2026
Validity: 10,000 days (~27 years)
```

## Testing Release Build

Before uploading, test the release build:

```bash
# Install release APK on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### Build fails with signing error
- Verify `keystore.properties` has correct paths
- Ensure keystore file exists in `android/app/`

### App crashes on release but works on debug
- Check ProGuard rules in `proguard-rules.pro`
- Add keep rules for any libraries causing issues

### Upload rejected by Play Store
- Ensure targetSdkVersion meets Play Store requirements (currently 33+)
- Check for any policy violations in app content

## Version History

| Version | Code | Date | Changes |
|---------|------|------|---------|
| 1.0.0   | 1    | TBD  | Initial release |

---

**Remember**: Always increment `versionCode` for each Play Store upload!
