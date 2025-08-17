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
    ];
    if (allowed.includes(origin)) return origin;
    if (origin.startsWith("exp://")) return origin;
    if (origin.match(/^http:\/\/192\.168\..+:8081$/)) return origin;
    if (origin.match(/^http:\/\/10\..+:8081$/)) return origin;
    if (origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\..+:8081$/)) return origin;
    if (origin.match(/^https?:\/\/.*\.exp\.direct$/)) return origin;
    return null;
  },
  credentials: true,
}));

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
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
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

export default app;