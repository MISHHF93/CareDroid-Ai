@echo off
echo ================================
echo CareDroid Quick Start
echo ================================
echo.
echo Starting Backend on port 3000...
cd backend
start "CareDroid Backend" cmd /k "npm run start:dev"
timeout /t 3 /nobreak > nul
cd ..
echo.
echo Starting Frontend on port 8000...
start "CareDroid Frontend" cmd /k "npm run dev"
echo.
echo ================================
echo Servers Starting...
echo ================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:8000
echo Swagger API: http://localhost:3000/api
echo.
echo Wait 10-15 seconds for compilation to complete.
echo Then open http://localhost:8000 in your browser!
echo.
pause
