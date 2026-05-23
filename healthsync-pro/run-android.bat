@echo off
title HealthSync Pro - Android Build & Run

echo.
echo ============================================
echo   HealthSync Pro - Android Device Build
echo ============================================
echo.

:: ── Step 1: Find Android SDK ─────────────────────────────────────────────
echo [1/6] Locating Android SDK...

set SDK_PATH=

:: Check ANDROID_HOME first
if defined ANDROID_HOME (
    if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
        set SDK_PATH=%ANDROID_HOME%
        echo   Found via ANDROID_HOME: %ANDROID_HOME%
        goto SDK_FOUND
    )
)

:: Check ANDROID_SDK_ROOT
if defined ANDROID_SDK_ROOT (
    if exist "%ANDROID_SDK_ROOT%\platform-tools\adb.exe" (
        set SDK_PATH=%ANDROID_SDK_ROOT%
        echo   Found via ANDROID_SDK_ROOT: %ANDROID_SDK_ROOT%
        goto SDK_FOUND
    )
)

:: Check common locations
for %%P in (
    "%LOCALAPPDATA%\Android\Sdk"
    "%USERPROFILE%\AppData\Local\Android\Sdk"
    "C:\Android\Sdk"
    "D:\Android\Sdk"
    "C:\Program Files\Android\Sdk"
) do (
    if exist "%%~P\platform-tools\adb.exe" (
        set SDK_PATH=%%~P
        echo   Found at: %%~P
        goto SDK_FOUND
    )
)

echo.
echo ERROR: Android SDK not found!
echo.
echo Please do ONE of the following:
echo   1. Open Android Studio ^> File ^> Project Structure ^> SDK Location
echo      Copy the path and set it in:
echo      healthsync-pro\android\local.properties
echo      as: sdk.dir=YOUR_PATH (use double backslashes)
echo.
echo   2. Set ANDROID_HOME environment variable:
echo      setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"
echo.
pause
exit /b 1

:SDK_FOUND
:: Update local.properties with found SDK path
echo sdk.dir=%SDK_PATH:\=\\% > android\local.properties
echo   Updated android\local.properties

:: ── Step 2: Check ADB ────────────────────────────────────────────────────
echo.
echo [2/6] Checking ADB and connected devices...
"%SDK_PATH%\platform-tools\adb.exe" devices

:: ── Step 3: Check Node.js ────────────────────────────────────────────────
echo.
echo [3/6] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: ── Step 4: Check Java ───────────────────────────────────────────────────
echo.
echo [4/6] Checking Java...
java -version 2>&1
if errorlevel 1 (
    echo ERROR: Java not found. Install JDK 17 from https://adoptium.net
    pause
    exit /b 1
)

:: ── Step 5: Start Metro bundler ──────────────────────────────────────────
echo.
echo [5/6] Starting Metro bundler...
echo   (Opening in new window - keep it running)
start "Metro Bundler - HealthSync Pro" cmd /k "npx react-native start --reset-cache"

:: Wait for Metro to start
echo   Waiting 8 seconds for Metro to initialize...
timeout /t 8 /nobreak > nul

:: ── Step 6: Build and install ────────────────────────────────────────────
echo.
echo [6/6] Building and installing on device...
echo.
echo IMPORTANT - Make sure your phone has:
echo   ^> USB Debugging ON  (Settings ^> Developer Options ^> USB Debugging)
echo   ^> Connected via USB cable
echo   ^> "Allow USB Debugging" dialog accepted on phone
echo   ^> File Transfer mode (not just charging)
echo.
timeout /t 3 /nobreak > nul

npx react-native run-android

echo.
if errorlevel 1 (
    echo ============================================
    echo   BUILD FAILED - Check errors above
    echo ============================================
    echo.
    echo Common fixes:
    echo   1. Make sure phone is connected: adb devices
    echo   2. Clean build: cd android ^&^& gradlew clean
    echo   3. Reset Metro: npx react-native start --reset-cache
    echo   4. Check Java version: java -version (needs JDK 17)
) else (
    echo ============================================
    echo   BUILD SUCCESSFUL - Check your device!
    echo ============================================
)
echo.
pause
