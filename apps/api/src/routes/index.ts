import type { Express, Request } from "express";
import { timingSafeEqual } from "node:crypto";
import { rateLimiter } from "../middleware/rateLimiter";
import { authMiddleware } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import * as userController from "../modules/users/controller";
import * as sourceController from "../modules/sources/controller";
import * as datasetService from "../modules/datasets/service";
import * as indicatorService from "../modules/indicators/service";
import * as analysisService from "../modules/analyses/service";
import * as scenarioService from "../modules/scenarios/service";
import * as reportService from "../modules/reports/service";
import * as authService from "../modules/auth/service";
import * as auditService from "../modules/audit/service";
import * as forecastService from "../modules/forecasts/service";
import * as modelRegistryService from "../modules/model-registry/service";
import * as notificationService from "../modules/notifications/service";
import { fiscalScenarioInputSchema } from "../modules/fiscal-balance/schema";
import { analyzeFiscalBalance, getFiscalDataset } from "../modules/fiscal-balance/service";
import * as newsService from "../modules/news/service";
import type { NewsTopic } from "../modules/news/service";
import { scrapeConfiguredSources } from "../modules/news/scraper";

export function registerRoutes(app: Express): void {
  // Apply rate limiter to all /api/v1 routes
  app.use("/api/v1", rateLimiter());

  // Public-source, deterministic research prototype; it does not depend on the database.
  app.get("/api/v1/research/fiscal-balance/data", async (_req, res) => {
    const dataset = await getFiscalDataset();
    res.json({ ok: true, data: dataset, meta: { timestamp: new Date().toISOString() } });
  });
  app.post("/api/v1/research/fiscal-balance/analyze", async (req, res) => {
    const parsed = fiscalScenarioInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: { code: "validation_error", message: parsed.error.message },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    const result = await analyzeFiscalBalance(parsed.data);
    res.json({
      ok: true,
      data: result,
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // ---- Authentication routes ----
  app.post("/api/v1/auth/login", userController.login);
  app.post("/api/v1/auth/register", userController.register);

  // Protected: /users
  app.get("/api/v1/users", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    const result = await userController.listUsers(req, res);
    return result;
  });
  app.get("/api/v1/users/:id", authMiddleware(), userController.getUser);

  // Protected: /sources
  app.get("/api/v1/sources", authMiddleware(), sourceController.listSources);
  app.post("/api/v1/sources", authMiddleware(), sourceController.createSource);
  app.get("/api/v1/sources/:id", authMiddleware(), sourceController.getSource);
  app.patch("/api/v1/sources/:id", authMiddleware(), sourceController.updateSource);
  app.delete("/api/v1/sources/:id", authMiddleware(), sourceController.deleteSource);

  // Protected: /news
  app.get("/api/v1/news", authMiddleware(), async (req, res) => {
    const requestedLimit = Number.parseInt((req.query.limit as string) ?? "50", 10);
    const requestedOffset = Number.parseInt((req.query.offset as string) ?? "0", 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(200, Math.max(1, requestedLimit)) : 50;
    const offset = Number.isFinite(requestedOffset) ? Math.max(0, requestedOffset) : 0;
    const category = req.query.category as string | undefined;
    const topic = req.query.topic as NewsTopic | undefined;
    const search = req.query.search as string | undefined;
    const result = await newsService.listNews({ limit, offset, category, topic, search });
    res.json({
      ok: true,
      data: { items: result.rows, meta: { total: result.total, limit, offset } },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.post("/api/v1/news/sync", authMiddleware(), async (req, res) => {
    const result = await scrapeConfiguredSources();
    res.json({
      ok: true,
      data: result,
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.get("/api/v1/news/sync", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret.length < 32) {
      res.status(503).json({
        ok: false,
        error: {
          code: "cron_secret_missing",
          message:
            "CRON_SECRET must be configured with at least 32 characters to run scheduled news syncs",
        },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    const authorization = req.get("authorization") ?? "";
    const token = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] ?? "";
    const expected = Buffer.from(cronSecret);
    const provided = Buffer.from(token);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      res.status(401).json({
        ok: false,
        error: { code: "unauthorized", message: "A valid cron authorization token is required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    const result = await scrapeConfiguredSources();
    res.json({
      ok: true,
      data: result,
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // Protected: /datasets
  app.get("/api/v1/datasets", authMiddleware(), async (req, res) => {
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const rows = await datasetService.listDatasets(
      req.query.sourceId as string | undefined,
      limit,
      offset,
    );
    res.json({
      ok: true,
      data: { datasets: rows },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // Protected: /indicators
  app.get("/api/v1/indicators", authMiddleware(), async (req, res) => {
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const rows = await indicatorService.listIndicators(
      req.query.category as string | undefined,
      limit,
      offset,
    );
    res.json({
      ok: true,
      data: { indicators: rows },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // Protected: /analyses
  app.post("/api/v1/analyses", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    if (!req.userId) {
      res.status(401).json({
        ok: false,
        error: { code: "unauthorized", message: "User ID required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    const analysis = await analysisService.createAnalysis(req.userId, req.body);
    res.status(201).json({
      ok: true,
      data: { analysis },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.get("/api/v1/analyses/:id", authMiddleware(), async (req: Request<{ id: string }>, res) => {
    try {
      const result = await analysisService.getAnalysisStatus(req.params.id);
      res.json({
        ok: true,
        data: result,
        meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
      });
    } catch {
      res.status(404).json({
        ok: false,
        error: { code: "not_found", message: "Analysis not found" },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  });

  // Protected: /scenarios
  app.get("/api/v1/scenarios", authMiddleware(), async (req, res) => {
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const rows = await scenarioService.listScenarios(limit, offset);
    res.json({
      ok: true,
      data: { scenarios: rows },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.post("/api/v1/scenarios", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    if (!req.userId) {
      res.status(401).json({
        ok: false,
        error: { code: "unauthorized", message: "User ID required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    const scenario = await scenarioService.createScenario({ ...req.body, createdBy: req.userId });
    res.status(201).json({
      ok: true,
      data: { scenario },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // Protected: /reports
  app.get("/api/v1/reports", authMiddleware(), async (req, res) => {
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const rows = await reportService.listReports(
      req.query.status as string | undefined,
      limit,
      offset,
    );
    res.json({
      ok: true,
      data: { reports: rows },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.post("/api/v1/reports", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    if (!req.userId) {
      res.status(401).json({
        ok: false,
        error: { code: "unauthorized", message: "User ID required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    const report = await reportService.createReport({
      userId: req.userId,
      title: req.body.title ?? "Untitled",
      content: req.body.content,
    });
    res.status(201).json({
      ok: true,
      data: { report },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.get("/api/v1/reports/:id", authMiddleware(), async (req: Request<{ id: string }>, res) => {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      res.status(404).json({
        ok: false,
        error: { code: "not_found", message: "Report not found" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    res.json({
      ok: true,
      data: { report },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // ---- Protected: /notifications ----
  app.get("/api/v1/notifications", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    if (!req.userId) {
      res.status(401).json({
        ok: false,
        error: { code: "unauthorized", message: "User ID required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const result = await notificationService.listNotifications(req.userId, limit, offset);
    res.json({
      ok: true,
      data: { notifications: result.rows, unread: result.unread },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.patch(
    "/api/v1/notifications/:id/read",
    authMiddleware(),
    async (req: Request<{ id: string }>, res) => {
      const ok = await notificationService.markAsRead(req.params.id);
      if (!ok) {
        res.status(404).json({
          ok: false,
          error: { code: "not_found", message: "Notification not found" },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }
      res.json({
        ok: true,
        data: null,
        meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
      });
    },
  );

  // ---- Protected: /audit (admin only) ----
  app.get("/api/v1/audit", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    if ((req.userRole ?? "") !== "admin") {
      res.status(403).json({
        ok: false,
        error: { code: "forbidden", message: "Admin access required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const rows = await auditService.getAuditLogs(
      limit,
      offset,
      req.query.resourceType as string | undefined,
    );
    res.json({
      ok: true,
      data: { audit_logs: rows },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // ---- Protected: /forecasts ----
  app.get("/api/v1/forecasts", authMiddleware(), async (req, res) => {
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const rows = await forecastService.listForecasts(
      req.query.analysisId as string | undefined,
      limit,
      offset,
    );
    res.json({
      ok: true,
      data: { forecasts: rows },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // ---- Protected: /model-registry ----
  app.get("/api/v1/model-registry", authMiddleware(), async (req, res) => {
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const isActive = req.query.active === "true";
    const rows = await modelRegistryService.listModels(isActive, limit, offset);
    res.json({
      ok: true,
      data: { models: rows },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
  app.get(
    "/api/v1/model-registry/:id",
    authMiddleware(),
    async (req: Request<{ id: string }>, res) => {
      const model = await modelRegistryService.getModelById(req.params.id);
      if (!model) {
        res.status(404).json({
          ok: false,
          error: { code: "not_found", message: "Model not found" },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }
      res.json({
        ok: true,
        data: { model },
        meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
      });
    },
  );

  // ---- AI Workflow (protected) ----
  app.get("/api/v1/ai-workflows", authMiddleware(), async (req, res) => {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({
        ok: false,
        error: { code: "unauthorized", message: "User ID required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const { AiWorkflowRepository } = await import("../modules/ai-workflow/repository");
    const repo = new AiWorkflowRepository();
    const data = await repo.findAll(userId, { status, type, limit, offset });

    res.json({
      ok: true,
      data: { workflows: data.rows, meta: { total: data.total, limit, offset } },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  app.post("/api/v1/ai-workflows", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    if (!req.userId) {
      res.status(401).json({
        ok: false,
        error: { code: "unauthorized", message: "User ID required" },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    const { createWorkflowSchema } = await import("../modules/ai-workflow/schema");
    const parsed = createWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: { code: "validation_error", message: parsed.error.message },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    const aiWorkflowService = await import("../modules/ai-workflow/service");
    const result = await aiWorkflowService.executeWorkflow(
      req.userId,
      parsed.data.title,
      parsed.data.type,
      parsed.data.parameters,
      parsed.data.model,
      parsed.data.systemPrompt,
    );

    const { AiWorkflowRepository, WorkflowTaskRepository } =
      await import("../modules/ai-workflow/repository");
    const repo = new AiWorkflowRepository();
    const workflow = await repo.findById(result.workflowId);
    const taskRepo = new WorkflowTaskRepository();
    const tasks = await taskRepo.findByWorkflow(result.workflowId);

    res.status(201).json({
      ok: true,
      data: { workflow, tasks, result },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  app.get(
    "/api/v1/ai-workflows/:id",
    authMiddleware(),
    async (req: Request<{ id: string }>, res) => {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) {
        res.status(401).json({
          ok: false,
          error: { code: "unauthorized", message: "User ID required" },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }

      const { AiWorkflowRepository, WorkflowTaskRepository } =
        await import("../modules/ai-workflow/repository");
      const repo = new AiWorkflowRepository();
      const workflow = await repo.findById(req.params.id);

      if (!workflow || workflow.user_id !== userId) {
        res.status(404).json({
          ok: false,
          error: { code: "not_found", message: "Workflow not found" },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }

      const taskRepo = new WorkflowTaskRepository();
      const tasks = await taskRepo.findByWorkflow(workflow.id);

      res.json({
        ok: true,
        data: { workflow, tasks },
        meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
      });
    },
  );

  app.delete(
    "/api/v1/ai-workflows/:id",
    authMiddleware(),
    async (req: Request<{ id: string }>, res) => {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) {
        res.status(401).json({
          ok: false,
          error: { code: "unauthorized", message: "User ID required" },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }

      const aiWorkflowService = await import("../modules/ai-workflow/service");
      try {
        const deleted = await aiWorkflowService.cancelWorkflow(req.params.id, userId);
        if (!deleted) {
          res.status(404).json({
            ok: false,
            error: { code: "not_found", message: "Workflow not found" },
            meta: { timestamp: new Date().toISOString() },
          });
          return;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("forbidden")) {
          res.status(403).json({
            ok: false,
            error: { code: "forbidden", message: "Not authorized" },
            meta: { timestamp: new Date().toISOString() },
          });
          return;
        }
        res.status(404).json({
          ok: false,
          error: { code: "not_found", message: "Workflow not found" },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }

      res.json({
        ok: true,
        data: { message: "Workflow cancelled and deleted" },
        meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
      });
    },
  );

  // ---- AI Service Health (unauthenticated) ----
  app.get("/api/v1/ai-health", async (req, res) => {
    const { checkOllamaStatus, listModels } = await import("../services/ollamaService");
    const status = await checkOllamaStatus();
    const models = await listModels();

    res.json({
      ok: true,
      data: { ...status, available_models: models },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });

  // ---- Auth logout (unauthenticated) ----
  app.post("/api/v1/auth/logout", authMiddleware(), async (req: AuthenticatedRequest, res) => {
    const token = (req.headers.authorization ?? "").slice(7);
    if (token) await authService.invalidateSession(token);
    res.json({
      ok: true,
      data: { message: "Logged out" },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  });
}
