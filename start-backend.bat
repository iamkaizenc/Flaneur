@echo off
echo 🚀 Starting Flâneur Backend Server...
echo 📍 Port: 8787
echo 🔧 Environment: development
echo 💾 DRY_RUN mode: enabled
echo.

REM Check if bun is installed
bun --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: bun is not installed or not in PATH
    echo 📥 Please install bun: https://bun.sh/
    pause
    exit /b 1
)

REM Check if port 8787 is already in use
netstat -ano | findstr :8787 >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Port 8787 is already in use
    echo 🔍 Process using port 8787:
    netstat -ano | findstr :8787
    echo.
    set /p "choice=❓ Kill the process and continue? (y/N): "
    if /i "%choice%"=="y" (
        echo 🔪 Killing processes on port 8787...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8787') do taskkill /PID %%a /F >nul 2>&1
        timeout /t 2 >nul
    ) else (
        echo ❌ Exiting...
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if exist .env (
    echo 📋 Loading environment variables from .env
) else (
    echo ⚠️  No .env file found, using defaults
)

REM Start the backend server
echo 🔄 Starting server...
echo 🌐 Backend will be available at: http://localhost:8787
echo 🏥 Health check: http://localhost:8787/api/health
echo 🔌 tRPC endpoint: http://localhost:8787/api/trpc
echo.
echo 💡 Press Ctrl+C to stop the server
echo ===============================================================

bun run backend/server.ts