# Fix Backend Connection Error

## Error: `[tRPC] Backend connection test failed: TypeError: Failed to fetch`

This error occurs because the backend server is not running. The app is designed to work with both a live backend server and demo data, but you're seeing this error because the backend server needs to be started.

## Quick Fix

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

### Option 2: Use Startup Scripts

**macOS/Linux:**
```bash
./start-backend.sh
```

**Windows:**
```cmd
start-backend.bat
```

## What This Fixes

- ✅ tRPC connection errors
- ✅ "Failed to fetch" errors  
- ✅ Backend status indicator will show "Connected"
- ✅ Real-time data instead of demo data
- ✅ All API functionality will work

## Alternative: Demo Mode

If you don't want to run the backend server, the app will continue working with demo data. The error message is just informational - all features will work with mock data.

## Troubleshooting

### Port Already in Use
If you get a port error, check if something is already running on port 8787:
```bash
lsof -i :8787  # macOS/Linux
netstat -ano | findstr :8787  # Windows
```

### Environment Issues
Make sure you have the `.env` file in your project root with the correct configuration.

### Still Having Issues?
1. Check that `bun` is installed: `bun --version`
2. Check that all dependencies are installed: `bun install`
3. Check the backend logs for any error messages

## Backend Server Details

- **Port:** 8787
- **Health Check:** http://localhost:8787/api/health
- **tRPC Endpoint:** http://localhost:8787/api/trpc
- **Environment:** Development with DRY_RUN mode enabled