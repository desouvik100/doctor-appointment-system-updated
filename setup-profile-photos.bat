@echo off
echo ╔════════════════════════════════════════════════════════════╗
echo ║         PROFILE PHOTO FEATURE SETUP                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📋 This script will:
echo    1. Run database migration for existing users
echo    2. Install required dependencies
echo    3. Verify setup
echo.

pause

echo.
echo ═══════════════════════════════════════════════════════════
echo STEP 1: Installing Dependencies
echo ═══════════════════════════════════════════════════════════
echo.

cd backend
echo Installing backend dependencies...
call npm install crypto-js
echo.

cd ../frontend
echo Installing frontend dependencies...
call npm install crypto-js
echo.

cd ..

echo.
echo ═══════════════════════════════════════════════════════════
echo STEP 2: Running Database Migration
echo ═══════════════════════════════════════════════════════════
echo.

cd backend
node migrate-add-profile-photo.js
cd ..

echo.
echo ═══════════════════════════════════════════════════════════
echo SETUP COMPLETE!
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ Profile photo feature is ready!
echo.
echo 📖 Next steps:
echo    1. Start backend: cd backend ^&^& npm start
echo    2. Start frontend: cd frontend ^&^& npm start
echo    3. Read PROFILE_PHOTO_GUIDE.md for usage
echo.

pause
