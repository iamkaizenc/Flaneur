# Backend Server Setup

## Quick Start

To fix the tRPC connection errors, you need to start the backend server:

### 1. Start the Backend Server

```bash
# In one terminal, start the backend server
bun run backend/server.ts
```

The server will start on port 8081 and you should see:
```
[Server] ✅ Flâneur API is running on http://localhost:8081
[Server] Health check: http://localhost:8081/api/health
[Server] tRPC endpoint: http://localhost:8081/api/trpc
```

### 2. Start the Expo App

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