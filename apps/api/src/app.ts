import "./loadEnv";
import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { registerRoutes } from "./routes/index";

export function createApp(): express.Express {
  const app = express();

  // Security and CORS middleware
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000", credentials: true }));

  // Request parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Unique request ID
  app.use((req, _res, next) => {
    const requestId = req.headers["x-request-id"];
    req.id = typeof requestId === "string" && requestId.trim() ? requestId : randomUUID();
    next();
  });

  // Logging middleware
  app.use(requestLogger());

  // Health endpoint (before auth routes)
  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      data: { status: "healthy" },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // Register all domain routes under /api/v1
  registerRoutes(app);

  // 404 handler for undefined routes
  app.use((_req, res) => {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Route not found" },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler());

  return app;
}

const app = createApp();

export default app;

