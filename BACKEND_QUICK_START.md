# Backend Quick Start Guide

## 🚨 Backend Server Not Running?

If you're seeing tRPC errors like "HTML Response received" or "Backend connection failed", it means the backend server is not running.

## ✅ How to Start the Backend Server

### Option 1: Using Bun (Recommended)
```bash
# Open a new terminal in your project directory
bun run backend/server.ts
```

### Option 2: Using the Shell Script (macOS/Linux)
```bash
# Make the script executable (first time only)
chmod +x start-backend.sh

# Run the script
./start-backend.sh
```

### Option 3: Using the Batch Script (Windows)
```cmd
start-backend.bat
```

## 🎯 What to Expect

When the backend starts successfully, you'll see:
```
✅ Flâneur API is running on http://localhost:8787
Health check: http://localhost:8787/api/health
tRPC endpoint: http://localhost:8787/api/trpc
Ready for connections!
```

## 🔄 App Behavior

- **Backend Running**: App uses live data from the backend server
- **Backend Offline**: App automatically switches to demo data mode
- **Auto-Reconnect**: App will automatically reconnect when backend comes back online

## 🐛 Troubleshooting

### Port Already in Use
If port 8787 is already in use, you can change it in the `.env` file:
```env
EXPO_PUBLIC_API_URL=http://localhost:8788
EXPO_PUBLIC_TRPC_URL=http://localhost:8788/api/trpc
```

### Network Issues on Mobile Device
For testing on a real mobile device, you may need to use your computer's IP address instead of `localhost`. Update the `.env` file:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8787
EXPO_PUBLIC_TRPC_URL=http://192.168.1.100:8787/api/trpc
```
Replace `192.168.1.100` with your actual IP address.

## 📱 Development Workflow

1. Start the backend server: `bun run backend/server.ts`
2. Start the Expo app: `bun run start`
3. Both will run simultaneously and the app will connect to the backend

The app is designed to work seamlessly whether the backend is running or not!