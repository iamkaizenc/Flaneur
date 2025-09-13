# 🚀 Flâneur Backend Server & OAuth Setup Guide

## ⚠️ Current Status: Backend Connection Error

The tRPC backend server is not currently running. This is required for OAuth authentication and live features.

## 🔥 Quick Start - Get Backend Running Now

### Option 1: Direct Command (Fastest)
```bash
bun run backend/server.ts
```

### Option 2: Using Scripts

**macOS/Linux:**
```bash
chmod +x start-backend.sh  # First time only
./start-backend.sh
```

**Windows:**
```cmd
start-backend.bat
```

## ✅ Success Indicators

When the server starts successfully, you'll see:
```
[Server] ✅ Flâneur API is running on http://localhost:8787
[Server] Health check: http://localhost:8787/api/health
[Server] tRPC endpoint: http://localhost:8787/api/trpc
[Server] Ready for connections!
```

The app will automatically detect the backend and enable OAuth features.

## 🔐 OAuth Implementation Status

### ✅ Fully Implemented Components:

1. **Backend OAuth Routes** (`/backend/trpc/routes/oauth/route.ts`)
   - Start OAuth flow
   - Handle callbacks
   - Token exchange
   - Token refresh
   - Account management

2. **OAuth UI** (`/app/platform-connect.tsx`)
   - Platform selection
   - Connection status
   - Demo/Live mode indicator

3. **Callback Handler** (`/app/oauth-callback.tsx`)
   - Processes OAuth redirects
   - Handles success/error states
   - Auto-redirects after completion

4. **Supported Platforms:**
   - ✅ X (Twitter) - with PKCE
   - ✅ Instagram
   - ✅ LinkedIn
   - ✅ TikTok
   - ✅ Facebook
   - ✅ Telegram (Bot Token)

## 🎯 OAuth Flow Diagram

```
1. User clicks "Connect Platform"
   ↓
2. Backend generates OAuth URL
   ↓
3. User authorizes on platform
   ↓
4. Platform redirects to callback
   ↓
5. Backend exchanges code for token
   ↓
6. Tokens encrypted and stored
   ↓
7. Connection complete!
```

## 🔧 Configuration

### Current Mode: DEMO (Safe Testing)
```env
LIVE_MODE=false
DRY_RUN=true
```

### To Enable Live OAuth:
1. Add real OAuth credentials to `.env`:
   ```env
   X_CLIENT_ID=your_real_x_client_id
   X_CLIENT_SECRET=your_real_x_client_secret
   META_APP_ID=your_real_meta_app_id
   META_APP_SECRET=your_real_meta_app_secret
   # ... etc
   ```

2. Set environment to LIVE:
   ```env
   LIVE_MODE=true
   DRY_RUN=false
   ```

3. Configure OAuth redirect URLs in each platform:
   - X/Twitter: `http://localhost:3000/api/oauth/x/callback`
   - Instagram: `http://localhost:3000/api/oauth/instagram/callback`
   - LinkedIn: `http://localhost:3000/api/oauth/linkedin/callback`
   - etc.

4. Restart the backend server

## 🛠️ Troubleshooting

### "Failed to fetch" Error
**Solution:** Backend is not running. Start it with `bun run backend/server.ts`

### Port 8787 Already in Use
**Solution:** Kill the process using the port:
```bash
# Find process
lsof -i :8787  # macOS/Linux
netstat -ano | findstr :8787  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### OAuth Not Working
1. Check backend is running
2. Verify `.env` credentials
3. Check browser console for errors
4. Ensure redirect URLs match platform config

### Bun Not Installed
**Solution:** Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

## 📊 Demo Mode Features

When backend is offline or in DEMO mode:
- ✅ Simulated OAuth connections
- ✅ Mock account data
- ✅ UI fully functional
- ✅ No real API calls
- ✅ Safe for testing

## 🚀 Next Steps

1. **Start the backend** (see Quick Start above)
2. **Test OAuth flow** in demo mode
3. **Add real credentials** when ready
4. **Switch to LIVE mode** for production

## 📚 Key Files Reference

- **Backend Server:** `/backend/server.ts`
- **OAuth Routes:** `/backend/trpc/routes/oauth/route.ts`
- **Platform Connect UI:** `/app/platform-connect.tsx`
- **OAuth Callback:** `/app/oauth-callback.tsx`
- **Environment Config:** `/.env`
- **tRPC Client:** `/lib/trpc.ts`

---

**Important:** The app continues working with mock data even without the backend, but OAuth and live features require the backend server to be running.