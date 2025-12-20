@echo off
echo Restoring production config...

REM Restore production config
if exist capacitor.config.prod.json (
    copy capacitor.config.prod.json capacitor.config.json >nul 2>&1
    del capacitor.config.prod.json >nul 2>&1
    echo Done! Production config restored.
) else (
    echo No backup found. Config unchanged.
)

echo.
echo Now run: npm run build ^& npx cap sync android
pause
