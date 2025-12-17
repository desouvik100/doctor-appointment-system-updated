@echo off
echo ========================================
echo Building HealthSync Android Release
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Building production React app...
set NODE_ENV=production
call npm run build

echo.
echo Step 3: Syncing with Capacitor...
call npx cap sync android

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Android Studio: npx cap open android
echo 2. Build signed APK: Build ^> Generate Signed Bundle / APK
echo 3. Or build debug APK: Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo.
echo The app will connect to:
echo https://doctor-appointment-system-updated.onrender.com
echo.
pause
