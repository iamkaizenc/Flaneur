#!/bin/bash

# Flâneur Backend Startup Script
echo "🚀 Starting Flâneur Backend Server..."
echo "📍 Port: 8787"
echo "🔧 Environment: development"
echo "💾 DRY_RUN mode: enabled"
echo ""

# Load environment variables
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found, using defaults"
fi

# Start the backend server
echo "🔄 Starting server..."
bun run backend/server.ts