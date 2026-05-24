@echo off
echo Clearing caches...
rmdir /s /q android\app\build 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo.
echo Starting Metro bundler with clean cache...
npx react-native start --reset-cache --port 8083
