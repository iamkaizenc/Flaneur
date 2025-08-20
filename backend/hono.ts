import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for Expo development
app.use("*", cors({
  origin: (origin) => {
    if (!origin) return origin;
    const allowed = [
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];
    if (allowed.includes(origin)) return origin;
    if (origin.startsWith("exp://")) return origin;
    if (origin.match(/^http:\/\/192\.168\..+:(8081|3000)$/)) return origin;
    if (origin.match(/^http:\/\/10\..+:(8081|3000)$/)) return origin;
    if (origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\..+:(8081|3000)$/)) return origin;
    if (origin.match(/^https?:\/\/.*\.exp\.direct$/)) return origin;
    return null;
  },
  credentials: true,
}));

// Add error handling middleware
app.onError((err, c) => {
  console.error('[Hono] Server error:', err);
  
  // Always return JSON, never HTML
  const errorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }
  };
  
  return c.json(errorResponse, 500);
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "Flâneur API"
  });
});

// Version endpoint
app.get("/version", (c) => {
  const packageJson = require("../../package.json");
  return c.json({ 
    version: packageJson.version || "1.0.0",
    name: packageJson.name || "flaneur",
    description: "Flâneur — Autonomous Social Media Agent"
  });
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC] Error on ${path}:`, error);
      
      // Ensure tRPC errors are always JSON
      return {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
          path,
          timestamp: new Date().toISOString()
        }
      };
    },
    responseMeta: () => {
      return {
        headers: {
          'Content-Type': 'application/json',
        },
      };
    },
  })
);

// Root endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Flâneur API is running",
    endpoints: {
      health: "/api/health",
      version: "/api/version",
      trpc: "/api/trpc"
    }
  });
});

// Catch-all for unmatched routes - always return JSON
app.notFound((c) => {
  console.log(`[Hono] 404 - Route not found: ${c.req.path}`);
  
  return c.json({ 
    error: { 
      code: 'NOT_FOUND',
      message: `Route not found: ${c.req.path}`,
      path: c.req.path,
      timestamp: new Date().toISOString()
    }
  }, 404);
});

export default app;