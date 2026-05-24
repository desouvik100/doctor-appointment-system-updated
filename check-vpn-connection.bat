@echo off
REM Check VPN and MongoDB connectivity

echo ============================================
echo VPN & MongoDB Connection Diagnostic
echo ============================================
echo.

echo [1/4] Checking internet connection...
ping 8.8.8.8 -n 1 >nul
if %errorlevel% equ 0 (
    echo ✅ Internet: Connected
) else (
    echo ❌ Internet: NOT connected
)

echo.
echo [2/4] Checking MongoDB DNS resolution...
nslookup ac-limmkbv-shard-00-00.qv72ila.mongodb.net | findstr "Address"

echo.
echo [3/4] Checking MongoDB IP reachability...
ping 159.41.197.15 -n 1 >nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB IP: Reachable
) else (
    echo ❌ MongoDB IP: NOT reachable
)

echo.
echo [4/4] Checking current IP address...
echo Your current IP (what MongoDB sees):
for /f "tokens=2 delims=:" %%a in ('nslookup myip.opendns.com resolver1.opendns.com ^| find "Address"') do echo %%a

echo.
echo ============================================
echo Make sure this IP is whitelisted in MongoDB Atlas!
echo Go to: https://cloud.mongodb.com/v2/YOUR_PROJECT/security/network/accessList
echo ============================================
echo.
pause
