@echo off
title HealthSync - Doctor Appointment System
color 0A
echo.
echo  ██╗  ██╗███████╗ █████╗ ██╗  ████████╗██╗  ██╗███████╗██╗   ██╗███╗   ██╗ ██████╗
echo  ██║  ██║██╔════╝██╔══██╗██║  ╚══██╔══╝██║  ██║██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
echo  ███████║█████╗  ███████║██║     ██║   ███████║███████╗ ╚████╔╝ ██╔██╗ ██║██║     
echo  ██╔══██║██╔══╝  ██╔══██║██║     ██║   ██╔══██║╚════██║  ╚██╔╝  ██║╚██╗██║██║     
echo  ██║  ██║███████╗██║  ██║███████╗██║   ██║  ██║███████║   ██║   ██║ ╚████║╚██████╗
echo  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝
echo.
echo  🏥 Doctor Appointment System - Starting...
echo.

echo [1/2] 🚀 Starting Backend Server (Port 5005)...
start "HealthSync Backend" cmd /k "cd backend && echo Backend Server Starting... && npm run dev"

echo [2/2] ⏳ Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak > nul

echo [2/2] 🌐 Starting Frontend Server (Port 3001)...
start "HealthSync Frontend" cmd /k "cd frontend && echo Frontend Server Starting... && npm start"

echo.
echo ✅ Both servers are starting up...
echo.
echo 📋 Server Information:
echo    🔧 Backend API: http://localhost:5005
echo    🌐 Frontend UI: http://localhost:3001
echo.
echo 💡 Tips:
echo    - Wait for both servers to fully load
echo    - Backend loads first, then frontend
echo    - Frontend will auto-open in browser
echo.
echo Press any key to close this window...
pause > nul