@echo off
echo Running build with full verbose output...
echo This will take a few minutes...
echo.
gradlew.bat app:assembleDebug --stacktrace --info > build-verbose-output.txt 2>&1
echo.
echo Build complete! Check build-verbose-output.txt for details.
echo.
echo Looking for error "26.0.1"...
findstr /C:"26.0.1" build-verbose-output.txt
echo.
echo Full output saved to: build-verbose-output.txt
pause
