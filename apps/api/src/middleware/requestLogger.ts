import type { Request, Response, NextFunction } from "express";
import winston from "winston";
import apiLogger from "../config/logger";

export function requestLogger(logger: winston.Logger = apiLogger) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const start = Date.now();
    const reqId = req.headers["x-request-id"] ?? req.id ?? "none";

    logger.info({
      level: "info",
      message: `${req.method} ${req.originalUrl}`,
      requestId: reqId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    _res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info({
        message: `${req.method} ${req.originalUrl} ${_res.statusCode} in ${duration}ms`,
        requestId: reqId,
        statusCode: _res.statusCode,
        durationMs: duration,
      });
    });

    next();
  };
}
