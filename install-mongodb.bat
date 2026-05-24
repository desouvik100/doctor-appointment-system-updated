@echo off
REM Install MongoDB Community Edition

echo ============================================
echo MongoDB Installation Guide
echo ============================================
echo.
echo Option 1: Download and Install Manually
echo - Go to: https://www.mongodb.com/try/download/community
echo - Download MongoDB Community Server
echo - Run the installer
echo - Choose "Install MongoDB as a Service"
echo.
echo Option 2: Use Chocolatey (if installed)
echo - Run: choco install mongodb-community
echo.
echo Option 3: Use Windows Package Manager
echo - Run: winget install MongoDB.Server
echo.
echo After installation:
echo 1. MongoDB service will start automatically
echo 2. Update .env to use: MONGODB_URI=mongodb://127.0.0.1:27017/doctor_appointment
echo 3. Restart the backend server
echo.
pause
