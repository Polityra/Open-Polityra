import type { Request, Response, NextFunction } from "express";
import winston from "winston";
import { AppError } from "../errors/appError";
import apiLogger from "../config/logger";

export function errorHandler(logger: winston.Logger = apiLogger) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        ok: false,
        error: { code: err.code, message: err.message },
        meta: { requestId: _req.id ?? "", timestamp: new Date().toISOString() },
      });
      return;
    }

    const errorDetails = {
      message: "Unhandled error",
      requestId: _req.id ?? "",
      error: err.message,
      stack: err.stack,
    };

    logger.error("[api] Unhandled error", errorDetails);

    res.status(500).json({
      ok: false,
      error: { code: "internal_error", message: "An unexpected error occurred" },
      meta: { requestId: _req.id ?? "", timestamp: new Date().toISOString() },
    });
  };
}
