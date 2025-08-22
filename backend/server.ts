import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import apiApp from "./hono";

const port = parseInt(process.env.PORT || "8787");

// Create main app and mount API at /api
const app = new Hono();

// Enable CORS for the main app
app.use("*", cors({
  origin: (origin) => {
    if (!origin) return origin;
    const allowed = [
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://localhost:8787",
      "http://127.0.0.1:8787",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];
    if (allowed.includes(origin)) return origin;
    if (origin.startsWith("exp://")) return origin;
    if (origin.match(/^http:\/\/192\.168\..+:(8081|8787|3000)$/)) return origin;
    if (origin.match(/^http:\/\/10\..+:(8081|8787|3000)$/)) return origin;
    if (origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\..+:(8081|8787|3000)$/)) return origin;
    if (origin.match(/^https?:\/\/.*\.exp\.direct$/)) return origin;
    return null;
  },
  credentials: true,
}));

// Root endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Flâneur Server is running",
    endpoints: {
      api: "/api",
      health: "/api/health",
      trpc: "/api/trpc"
    },
    timestamp: new Date().toISOString()
  });
});

// Mount API app at /api
app.route("/api", apiApp);

console.log(`[Server] Starting Flâneur API server on port ${port}`);
console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`[Server] DRY_RUN mode: ${process.env.DRY_RUN === "true"}`);
console.log(`[Server] LIVE mode: ${process.env.LIVE_MODE === "true"}`);

serve({
  fetch: app.fetch,
  port,
}, (info: any) => {
  console.log(`[Server] ✅ Flâneur API is running on http://localhost:${info.port}`);
  console.log(`[Server] Health check: http://localhost:${info.port}/api/health`);
  console.log(`[Server] tRPC endpoint: http://localhost:${info.port}/api/trpc`);
  console.log(`[Server] Ready for connections!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});