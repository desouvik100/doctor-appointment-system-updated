# HealthSync Pro — Android Setup Guide

## 🔧 Fix: Android SDK Not Found

The build is failing because `local.properties` has the wrong Android SDK path.

### Step 1: Find your Android SDK path

**Option A — Android Studio:**
1. Open Android Studio
2. Go to **File → Project Structure** (Ctrl+Alt+Shift+S)
3. Click **SDK Location** on the left
4. Copy the **Android SDK location** path

**Option B — Command Prompt:**
```cmd
echo %ANDROID_HOME%
echo %ANDROID_SDK_ROOT%
```

**Option C — Check common locations:**
- `C:\Users\YourName\AppData\Local\Android\Sdk`
- `C:\Android\Sdk`
- `D:\Android\Sdk`

### Step 2: Update `local.properties`

Open `healthsync-pro\android\local.properties` and update:
```properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```
(Use double backslashes `\\`)

### Step 3: Run the app

**Option A — Use the batch script:**
```
Double-click: healthsync-pro\run-android.bat
```

**Option B — Manual commands:**
```cmd
cd healthsync-pro

# Terminal 1: Start Metro bundler
npx react-native start --reset-cache

# Terminal 2: Build and install (with phone connected)
npx react-native run-android
```

## 📱 Phone Setup

1. Enable **Developer Options**: Settings → About Phone → tap Build Number 7 times
2. Enable **USB Debugging**: Settings → Developer Options → USB Debugging → ON
3. Connect phone via USB cable
4. Select **File Transfer** mode (not just charging)
5. Accept the "Allow USB Debugging" dialog on your phone
6. Verify connection: `adb devices` (should show your device)

## 🔑 Login Credentials (for testing)

**Doctor Login:**
- Email: your doctor email
- Password: your doctor password

**Staff Login:**
- Email: your staff email  
- Password: your staff password

**Admin Login:**
- Email: your admin email
- Password: your admin password

## 🐛 Common Build Errors

### "SDK location not found"
→ Update `android/local.properties` with correct SDK path

### "No connected devices"
→ Check USB cable, enable USB debugging, run `adb devices`

### "Metro bundler not running"
→ Run `npx react-native start` in a separate terminal first

### "Build failed: AAR metadata"
→ Run `cd android && gradlew clean` then try again

### "Gradle daemon issues"
→ Run `cd android && gradlew --stop` then try again

### "Java version mismatch"
→ Make sure JDK 17 is installed and set as JAVA_HOME
→ Download from: https://adoptium.net/temurin/releases/?version=17
