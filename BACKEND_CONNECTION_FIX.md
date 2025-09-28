# Backend Connection Fix Guide

## Quick Fix

The error "Failed to fetch" means your backend server is not running. Here's how to fix it:

### Option 1: Start Backend Server (Recommended)

1. **Open a new terminal** in your project directory
2. **Run the backend server:**
   ```bash
   bun run backend/server.ts
   ```
3. **Wait for the success message:**
   ```
   ✅ Flâneur API is running on http://localhost:8787
   ```
4. **The app will automatically reconnect** - you should see the error disappear

### Option 2: Use the Simple Starter Script

```bash
node start-backend-simple.js
```

### Option 3: Use Existing Scripts

**macOS/Linux:**
```bash
./start-backend.sh
```

**Windows:**
```bash
start-backend.bat
```

## Verification

Once the backend is running, you can verify it's working by:

1. **Check the health endpoint:** http://localhost:8787/api/health
2. **Check the tRPC endpoint:** http://localhost:8787/api/trpc
3. **Look for the green "Backend Connected" status** in your app

## Troubleshooting

### If the backend won't start:

1. **Check if port 8787 is already in use:**
   ```bash
   lsof -i :8787  # macOS/Linux
   netstat -ano | findstr :8787  # Windows
   ```

2. **Kill any process using port 8787:**
   ```bash
   kill -9 <PID>  # macOS/Linux
   taskkill /PID <PID> /F  # Windows
   ```

3. **Check your .env file** - make sure it has:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8787
   EXPO_PUBLIC_TRPC_URL=http://localhost:8787/api/trpc
   ```

### If you're still getting connection errors:

1. **Check your network configuration** - make sure localhost is accessible
2. **Try using 127.0.0.1 instead of localhost** in your .env file
3. **Disable any VPN or proxy** that might be blocking local connections
4. **Check firewall settings** - make sure port 8787 is allowed

## Demo Mode

If you can't get the backend running, the app will continue to work with demo data. You'll see:
- "Backend Offline - Using Demo Data" status
- All features work with mock data
- No real API calls are made

## Development Workflow

For the best development experience:

1. **Always start the backend first:**
   ```bash
   bun run backend/server.ts
   ```

2. **Then start the Expo app:**
   ```bash
   bun start
   ```

3. **Or use concurrently to start both:**
   ```bash
   bunx concurrently "bun run backend/server.ts" "bun start"
   ```

The app is designed to work seamlessly whether the backend is available or not, but you'll get the full experience with the backend running.