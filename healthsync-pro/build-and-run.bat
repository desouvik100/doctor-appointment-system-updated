@echo off
REM Build and run HealthSync Pro on Android device

echo ============================================
echo HealthSync Pro - Android Build & Run
echo ============================================
echo.

REM Navigate to healthsync-pro directory
cd /d "d:\Startup-Project\doctor-appointment-system\healthsync-pro"

echo [1/4] Cleaning previous build...
cd android
call gradlew.bat clean
cd ..

echo.
echo [2/4] Installing dependencies...
call npm install

echo.
echo [3/4] Starting Metro bundler...
start cmd /k "npm start"

echo.
echo [4/4] Building and installing on device...
timeout /t 5
call npm run android:device

echo.
echo ============================================
echo Build complete! Check your device.
echo ============================================
pause
