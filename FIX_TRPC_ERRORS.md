# 🚨 Fix tRPC Connection Errors

## The Problem

You're seeing these errors because the **backend server is not running**:

```
[TRPC] HTML Response received: <!DOCTYPE html>
[TRPC] Fetch error: TRPCClientError: [HTML_RESPONSE] Expected JSON but received HTML
```

## The Solution

The app needs a backend server running on port 8787. Here's how to fix it:

### Option 1: Quick Start (Recommended)

**macOS/Linux:**
```bash
chmod +x start-backend.sh
./start-backend.sh
```

**Windows:**
```cmd
start-backend.bat
```

### Option 2: Manual Start

```bash
bun run backend/server.ts
```

### What You Should See

When the backend starts successfully:

```
🚀 Starting Flâneur Backend Server...
[Server] ✅ Flâneur API is running on http://localhost:8787
[Server] Health check: http://localhost:8787/api/health
[Server] tRPC endpoint: http://localhost:8787/api/trpc
[Server] Ready for connections!
```

### Then Start Your App

In a **separate terminal**:

```bash
bun start
```

## Verification

1. **Backend Health**: Visit http://localhost:8787/api/health in your browser
2. **App Connection**: The tRPC errors should disappear
3. **Status Indicator**: Look for the connection status in your app

## Fallback Mode

If you don't want to run the backend, the app will automatically use mock data and show an "Offline Mode" indicator. All features work with simulated responses.

## Need Help?

- Check `BACKEND_SETUP.md` for detailed instructions
- The backend runs in DRY_RUN mode by default (safe for testing)
- All data is mocked/simulated until you configure real services

---

**TL;DR**: Run `./start-backend.sh` (or `start-backend.bat` on Windows) in one terminal, then `bun start` in another terminal.