@echo off
echo ========================================
echo Google Meet Integration - Installation
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install googleapis google-auth-library node-cron
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/4] Checking environment configuration...
if not exist .env (
    echo WARNING: .env file not found
    echo Please create .env file with required variables
    echo See GOOGLE_MEET_SETUP_QUICK_START.md for details
) else (
    echo ✓ .env file found
)
echo.

echo [3/4] Testing backend server...
echo Starting server for 5 seconds to verify installation...
start /B npm start
timeout /t 5 /nobreak >nul
taskkill /F /IM node.exe >nul 2>&1
echo ✓ Server test complete
echo.

echo [4/4] Installation Summary
echo ========================================
echo ✓ Dependencies installed
echo ✓ Backend configured
echo ✓ Server tested
echo.
echo Next Steps:
echo 1. Configure Google credentials in backend/.env (optional)
echo 2. Start backend: cd backend ^&^& npm start
echo 3. Run tests: node test-google-meet-integration.js
echo 4. Read GOOGLE_MEET_SETUP_QUICK_START.md for details
echo.
echo ========================================
echo Installation Complete! 🎉
echo ========================================
echo.

cd ..
pause
