@echo off
echo 🚀 Starting Flâneur Backend Server...
echo 📍 Port: 8787
echo 🔧 Environment: development
echo 💾 DRY_RUN mode: enabled
echo.

REM Check if .env file exists
if exist .env (
    echo 📋 Loading environment variables from .env
) else (
    echo ⚠️  No .env file found, using defaults
)

REM Start the backend server
echo 🔄 Starting server...
bun run backend/server.ts