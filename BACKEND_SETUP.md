# Backend Server Setup

## 🚨 IMPORTANT: Fix tRPC Connection Errors

The tRPC errors you're seeing happen because the backend server is not running. The app expects a backend server on port 8787.

## Quick Start (Choose One Method)

### Method 1: Use the Startup Scripts (Recommended)

**On macOS/Linux:**
```bash
# Make the script executable
chmod +x start-backend.sh

# Start the backend server
./start-backend.sh
```

**On Windows:**
```cmd
# Double-click start-backend.bat or run:
start-backend.bat
```

### Method 2: Manual Start

```bash
# In one terminal, start the backend server
bun run backend/server.ts
```

### Expected Output

When the server starts successfully, you should see:
```
🚀 Starting Flâneur Backend Server...
[Server] ✅ Flâneur API is running on http://localhost:8787
[Server] Health check: http://localhost:8787/api/health
[Server] tRPC endpoint: http://localhost:8787/api/trpc
[Server] Ready for connections!
```

### Start the Expo App

```bash
# In another terminal, start the Expo app
bun start
```

## Verification

1. **Check Backend Health**: Visit http://localhost:8081/api/health in your browser
2. **Check tRPC**: The app should now connect successfully without HTML errors

## For Mobile Device Testing

If testing on a real mobile device, update the `.env` file:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8081
EXPO_PUBLIC_TRPC_URL=http://YOUR_LAN_IP:8081/api/trpc
```

Replace `YOUR_LAN_IP` with your computer's local IP address (e.g., `192.168.1.100`).

## Fallback Mode

If the backend is not running, the app will automatically use mock data and show a warning. All features will continue to work with simulated responses.

## Troubleshooting

- **Port 8081 in use**: Change the port in `backend/server.ts` and update the `.env` file
- **CORS errors**: The server is configured to allow requests from Expo development servers
- **Connection refused**: Make sure the backend server is running before starting the Expo app