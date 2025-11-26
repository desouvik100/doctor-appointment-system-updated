@echo off
echo ========================================
echo    HealthSync AI Performance Test Suite
echo ========================================
echo.

echo 🚀 Starting performance tests for 60fps on low-end devices...
echo.

echo 📋 Step 1: Running Jest performance tests...
cd frontend
call npm run test:performance
if %errorlevel% neq 0 (
    echo ❌ Jest tests failed!
    pause
    exit /b 1
)

echo.
echo ✅ Jest tests completed successfully!
echo.

echo 📋 Step 2: Starting frontend server for benchmark...
start "Frontend Server" cmd /c "npm start"

echo ⏳ Waiting for frontend to start (30 seconds)...
timeout /t 30 /nobreak > nul

echo.
echo 📋 Step 3: Running Puppeteer benchmark on http://localhost:3001...
cd ..
node performance-benchmark.js
if %errorlevel% neq 0 (
    echo ❌ Benchmark failed!
    pause
    exit /b 1
)

echo.
echo ✅ All performance tests completed successfully!
echo 📄 Check performance-results.json and performance-report.html for detailed results
echo.

pause