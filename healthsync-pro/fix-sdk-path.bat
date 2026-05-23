@echo off
title Fix Android SDK Path

echo.
echo ============================================
echo   HealthSync Pro - Fix Android SDK Path
echo ============================================
echo.

:: Try to find SDK from Android Studio's config
set STUDIO_CONFIG=%APPDATA%\Google\AndroidStudio*
set SDK_PATH=

:: Check ANDROID_HOME
if defined ANDROID_HOME (
    if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
        set SDK_PATH=%ANDROID_HOME%
        goto FOUND
    )
)

:: Check ANDROID_SDK_ROOT
if defined ANDROID_SDK_ROOT (
    if exist "%ANDROID_SDK_ROOT%\platform-tools\adb.exe" (
        set SDK_PATH=%ANDROID_SDK_ROOT%
        goto FOUND
    )
)

:: Check common locations
for %%P in (
    "%LOCALAPPDATA%\Android\Sdk"
    "%USERPROFILE%\AppData\Local\Android\Sdk"
    "C:\Android\Sdk"
    "D:\Android\Sdk"
    "C:\Program Files\Android\Sdk"
    "C:\Program Files (x86)\Android\android-sdk"
) do (
    if exist "%%~P\platform-tools\adb.exe" (
        set SDK_PATH=%%~P
        goto FOUND
    )
)

echo SDK not found automatically.
echo.
echo Please enter your Android SDK path manually:
echo (Find it in Android Studio: File ^> Project Structure ^> SDK Location)
echo.
set /p SDK_PATH="SDK Path: "

if not exist "%SDK_PATH%\platform-tools\adb.exe" (
    echo ERROR: Invalid SDK path. adb.exe not found at: %SDK_PATH%\platform-tools\adb.exe
    pause
    exit /b 1
)

:FOUND
echo.
echo Found Android SDK at: %SDK_PATH%
echo.

:: Write to local.properties (escape backslashes)
set ESCAPED_PATH=%SDK_PATH:\=\\%
echo sdk.dir=%ESCAPED_PATH% > android\local.properties
echo.
echo Updated android\local.properties:
type android\local.properties
echo.
echo ============================================
echo   SDK path fixed! Now run: run-android.bat
echo ============================================
echo.
pause
