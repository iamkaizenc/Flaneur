#!/bin/bash

# Flâneur Backend Startup Script
echo "🚀 Starting Flâneur Backend Server..."
echo "📍 Port: 8787"
echo "🔧 Environment: development"
echo "💾 DRY_RUN mode: enabled"
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed or not in PATH"
    echo "📥 Please install bun: https://bun.sh/"
    exit 1
fi

# Check if port 8787 is already in use
if lsof -Pi :8787 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8787 is already in use"
    echo "🔍 Process using port 8787:"
    lsof -i :8787
    echo ""
    read -p "❓ Kill the process and continue? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔪 Killing process on port 8787..."
        lsof -ti:8787 | xargs kill -9
        sleep 2
    else
        echo "❌ Exiting..."
        exit 1
    fi
fi

# Load environment variables
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found, using defaults"
fi

# Start the backend server
echo "🔄 Starting server..."
echo "🌐 Backend will be available at: http://localhost:8787"
echo "🏥 Health check: http://localhost:8787/api/health"
echo "🔌 tRPC endpoint: http://localhost:8787/api/trpc"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo "═══════════════════════════════════════════════════════════"

bun run backend/server.ts