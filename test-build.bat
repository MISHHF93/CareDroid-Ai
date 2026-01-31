@echo off
REM Test and Build Script for CareDroid
REM This script verifies the build and tests basic functionality

echo.
echo ================================
echo CareDroid Test & Build Script
echo ================================
echo.

REM Check Node.js installation
echo [1/5] Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    exit /b 1
)
echo.

REM Check npm installation
echo [2/5] Checking npm installation...
npm --version
if errorlevel 1 (
    echo ERROR: npm is not installed
    exit /b 1
)
echo.

REM Install dependencies
echo [3/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)
echo.

REM Build the project
echo [4/5] Building the project...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    exit /b 1
)
echo.

REM Check for build output
echo [5/5] Verifying build output...
if exist "dist" (
    echo SUCCESS: Build output directory created
    dir /S dist | find /C "File" > nul && (
        echo SUCCESS: Build files present
    ) || (
        echo ERROR: Build output is empty
        exit /b 1
    )
) else (
    echo ERROR: Build output directory not found
    exit /b 1
)
echo.

echo ================================
echo All checks passed!
echo ================================
echo.
echo Next steps:
echo 1. Start the development server: npm run dev
echo 2. Start both servers: npm run start:all
echo 3. Open http://localhost:5173 in your browser
echo 4. Test the following:
echo    - Navigate to /privacy, /terms, /consent
echo    - Check /team (requires permissions)
echo    - Test notifications in header
echo    - Open DevTools and check Service Worker registration
echo.
pause
