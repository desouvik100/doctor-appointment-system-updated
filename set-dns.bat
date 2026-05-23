
@echo off
REM Run this as Administrator to set Google DNS
echo Setting DNS to Google (8.8.8.8 and 8.8.4.4)...
netsh interface ipv4 set dnsservers name="Wi-Fi" static 8.8.8.8 primary
netsh interface ipv4 add dnsservers name="Wi-Fi" 8.8.4.4 index=2
echo DNS settings updated!
echo.
echo Verifying DNS...
ipconfig /all | findstr /A:2 "DNS Servers"
pause
