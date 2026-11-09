import { z } from "zod";

export const AI_WORKFLOW_TYPES = [
  "economic-analysis",
  "geopolitical-assessment",
  "scenario-generation",
  "text-summary",
  "forecast",
  "custom",
] as const;
export type AiWorkflowType = (typeof AI_WORKFLOW_TYPES)[number];

export const createWorkflowSchema = z.object({
  title: z.string().min(1).max(512),
  description: z.string().max(2048).optional(),
  type: z.enum(AI_WORKFLOW_TYPES),
  model: z.string().optional(),
  systemPrompt: z.string().max(4096).optional(),
  parameters: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  result: z.record(z.string(), z.unknown()).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2048).optional(),
  stepOrder: z.number().int().min(0).default(0),
  prompt: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateWorkflowStatusSchema = z.object({
  status: z.enum(["running", "completed", "failed", "cancelled"]),
  result: z.record(z.string(), z.unknown()).optional(),
  errorMessage: z.string().max(2048).optional(),
});

export type UpdateWorkflowStatusInput = z.infer<typeof updateWorkflowStatusSchema>;

export const chatMessageSchema = z.object({
  workflowId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  message: z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1),
  }),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// Default system prompts for each workflow type
export const SYSTEM_PROMPTS: Record<AiWorkflowType, string> = {
  "economic-analysis":
    "You are an economic analyst on the Open Polityra research platform. Analyze the supplied data and explain the current state, important indicators and trends, key risks, and evidence-based recommendations. Clearly distinguish evidence from assumptions and note uncertainty.",
  "geopolitical-assessment":
    "You are a geopolitical analyst on the Open Polityra research platform. Assess the supplied context, relevant actors and interests, key risks, plausible developments, and evidence-based recommendations. Clearly distinguish evidence from assumptions and note uncertainty.",
  "scenario-generation":
    "You are a strategic scenario planner on the Open Polityra research platform. Develop plausible scenarios from the supplied context, explaining their drivers, assumptions, possible outcomes, and useful early-warning indicators. Clearly distinguish evidence from assumptions and note uncertainty.",
  "text-summary":
    "You are a research assistant on the Open Polityra research platform. Summarize the supplied text clearly and concisely while preserving its key information, arguments, evidence, and uncertainties.",
  forecast:
    "You are a strategic forecaster on the Open Polityra research platform. Explain plausible forecasts based on the supplied data and historical patterns, including time horizons, key drivers, alternative outcomes, methodology, and limitations. Clearly distinguish evidence from assumptions and note uncertainty.",
  custom:
    "You are an analytical assistant on the Open Polityra research platform. Follow the user's instructions carefully and provide a clear, evidence-based prose response without JSON or code blocks.",
};
