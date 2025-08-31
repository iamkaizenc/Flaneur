# Starting the Backend Server

The app is designed to work with demo data when the backend is not running, but you can start the backend server for full functionality.

## Quick Start

### Option 1: Using the startup script (macOS/Linux)
```bash
./start-backend.sh
```

### Option 2: Using bun directly
```bash
bun run backend/server.ts
```

### Option 3: Using package.json script (if available)
```bash
bun run backend
```

## What to expect

When the backend starts successfully, you'll see:
```
✅ Flâneur API is running on http://localhost:8787
```

The app will automatically detect when the backend comes online and switch from demo data to live data.

## Troubleshooting

### Backend not starting
- Make sure you have `bun` installed
- Check that port 8787 is not in use by another process
- Verify all dependencies are installed with `bun install`

### App still showing "Backend Offline"
- Wait a few seconds for the app to detect the backend
- Try refreshing the app
- Check the browser console for connection errors

### Connection errors
The app is configured to:
- Try connecting to `http://localhost:8787` by default
- Fall back to demo data if the backend is unavailable
- Show minimal error messages to avoid noise
- Automatically reconnect when the backend comes back online

## Demo Mode

When the backend is not running, the app operates in demo mode with:
- Sample content and data
- Simulated API responses
- All UI functionality working
- No real social media connections

This allows you to explore the app's features without needing to set up the full backend infrastructure.