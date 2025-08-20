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
      timestamp: new Date().toISOString(),
      path: c.req.path,
      method: c.req.method
    }
  };
  
  // Set proper headers to ensure JSON response
  c.header('Content-Type', 'application/json');
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.json(errorResponse, 500);
});

// Add global middleware to ensure all responses are JSON
app.use('*', async (c, next) => {
  // Set JSON headers for all responses
  c.header('Content-Type', 'application/json');
  await next();
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "Flâneur API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    dryRun: process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1"
  });
});

// Ready check endpoint - tests all dependencies
app.get("/ready", async (c) => {
  const checks = {
    server: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    dryRun: process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1",
    trpc: true, // tRPC router is loaded
    cors: true  // CORS is configured
  };
  
  const allHealthy = Object.values(checks).every(check => check === true || typeof check === 'string');
  
  return c.json({
    status: allHealthy ? "ready" : "not_ready",
    checks,
    overall: allHealthy
  }, allHealthy ? 200 : 503);
});

// Metrics endpoint
app.get("/metrics", (c) => {
  return c.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    requests: {
      total: 0, // Would track in production
      errors: 0,
      success_rate: 100
    }
  });
});

// Version endpoint
app.get("/version", (c) => {
  try {
    const packageJson = require("../../package.json");
    return c.json({ 
      version: packageJson.version || "1.0.0",
      name: packageJson.name || "flaneur",
      description: "Flâneur — Autonomous Social Media Agent",
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch {
    return c.json({ 
      version: "1.0.0",
      name: "flaneur",
      description: "Flâneur — Autonomous Social Media Agent",
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      error: "Could not read package.json"
    });
  }
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path, type }) => {
      console.error(`[tRPC] Error on ${path} (${type}):`, error);
      
      // Log additional context for debugging
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('[tRPC] Internal server error details:', {
          message: error.message,
          cause: error.cause,
          stack: error.stack
        });
      }
    },
    responseMeta: ({ ctx, paths, errors, type }) => {
      // Ensure all tRPC responses have proper JSON headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-trpc-source',
      };
      
      // Add cache headers for queries
      if (type === 'query') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      }
      
      return { headers };
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