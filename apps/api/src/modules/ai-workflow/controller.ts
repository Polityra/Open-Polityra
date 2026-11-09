import type { Request, Response } from "express";
import * as aiWorkflowService from "./service";
import { checkOllamaStatus, listModels } from "../../services/ollamaService";
import { AiWorkflowRepository, WorkflowTaskRepository } from "./repository";
import { createWorkflowSchema, type AiWorkflowType } from "./schema";

type AuthenticatedRequest = Request & { userId?: string };
type AuthenticatedWorkflowRequest = Request<{ id: string }> & { userId?: string };

export async function listWorkflows(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId;
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

  const repo = new AiWorkflowRepository();
  const data = await repo.findAll(userId, { status, type, limit, offset });

  res.json({
    ok: true,
    data: { workflows: data.rows, meta: { total: data.total, limit, offset } },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}

export async function getWorkflow(req: AuthenticatedWorkflowRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "User ID required" },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

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
}

export async function createWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "User ID required" },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

  const parsed = createWorkflowSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: parsed.error.message },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

  const result = await aiWorkflowService.executeWorkflow(
    userId,
    parsed.data.title,
    parsed.data.type as AiWorkflowType,
    parsed.data.parameters,
    parsed.data.model,
    parsed.data.systemPrompt,
  );

  const repo = new AiWorkflowRepository();
  const workflow = await repo.findById(result.workflowId);
  const taskRepo = new WorkflowTaskRepository();
  const tasks = await taskRepo.findByWorkflow(result.workflowId);

  res.status(201).json({
    ok: true,
    data: { workflow, tasks, result },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}

export async function cancelWorkflow(
  req: AuthenticatedWorkflowRequest,
  res: Response,
): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "User ID required" },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

  const ok = await aiWorkflowService.cancelWorkflow(req.params.id, userId);

  if (!ok) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Workflow not found" },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

  res.json({
    ok: true,
    data: { message: "Workflow cancelled" },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}

export async function checkOllama(req: Request, res: Response): Promise<void> {
  const status = await checkOllamaStatus();
  const models = await listModels();

  res.json({
    ok: true,
    data: { ...status, available_models: models },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}
