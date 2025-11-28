@echo off
echo ========================================
echo  HealthSync Pro - Fresh Style Restart
echo ========================================
echo.

echo Step 1: Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Step 2: Clearing npm cache...
cd frontend
call npm cache clean --force
cd ..

echo Step 3: Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 >nul

echo Step 4: Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo  Servers Starting!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT: 
echo 1. Wait for both servers to fully start
echo 2. Open browser in INCOGNITO mode
echo 3. Go to http://localhost:3000
echo 4. Press Ctrl+Shift+R to hard refresh
echo.
echo If you still don't see styling:
echo - Check STYLING_TROUBLESHOOTING.md
echo - Visit http://localhost:3000/style-test
echo.
pause
