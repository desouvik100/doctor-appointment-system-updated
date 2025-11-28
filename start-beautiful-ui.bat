@echo off
echo ========================================
echo  Starting HealthSync Pro Beautiful UI
echo ========================================
echo.

echo Starting Backend Server...
start "HealthSync Backend" cmd /k "cd backend && npm start"

timeout /t 3 >nul

echo Starting Frontend Server...
start "HealthSync Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo  SERVERS STARTING!
echo ========================================
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo WAIT for "Compiled successfully!" message
echo Then open: http://localhost:3000
echo.
echo Press Ctrl+Shift+R to see the beautiful UI!
echo.
pause
