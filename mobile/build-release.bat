@echo off
echo ========================================
echo Building HealthSync Release APK
echo ========================================
echo.

REM Check if keystore.properties exists
if not exist "android\keystore.properties" (
    echo WARNING: keystore.properties not found!
    echo.
    echo This will use debug keystore for signing.
    echo For production, create keystore.properties from the example file.
    echo.
    pause
)

echo Cleaning previous builds...
cd android
call gradlew clean

echo.
echo Building release APK...
call gradlew assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo APK Location:
    echo android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo You can now install this APK on your device.
    echo.
) else (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo.
    echo Check the error messages above.
    echo.
)

cd ..
pause
