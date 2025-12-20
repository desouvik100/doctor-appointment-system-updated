@echo off
echo ========================================
echo  HealthSync Live Reload Setup
echo ========================================
echo.

REM Backup production config
copy capacitor.config.json capacitor.config.prod.json >nul 2>&1

REM Use dev config with live reload
copy capacitor.config.dev.json capacitor.config.json >nul 2>&1

echo [1/3] Starting React dev server...
start cmd /k "npm start"

echo.
echo [2/3] Waiting for dev server to start (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo [3/3] Syncing with Android...
call npx cap sync android

echo.
echo ========================================
echo  LIVE RELOAD READY!
echo ========================================
echo.
echo Your phone and computer must be on the SAME WiFi network.
echo.
echo Now:
echo 1. Open Android Studio
echo 2. Run the app on your connected device
echo 3. Changes in VS Code will auto-refresh!
echo.
echo To stop: Close this window and run restore-production.bat
echo.
pause
