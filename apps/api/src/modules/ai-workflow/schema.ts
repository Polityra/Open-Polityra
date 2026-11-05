import { z } from 'zod';

export const AI_WORKFLOW_TYPES = ['economic-analysis', 'geopolitical-assessment', 'scenario-generation', 'text-summary', 'forecast', 'custom'] as const;
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
  status: z.enum(['running', 'completed', 'failed', 'cancelled']),
  result: z.record(z.string(), z.unknown()).optional(),
  errorMessage: z.string().max(2048).optional(),
});

export type UpdateWorkflowStatusInput = z.infer<typeof updateWorkflowStatusSchema>;

export const chatMessageSchema = z.object({
  workflowId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  message: z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1),
  }),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// Default system prompts for each workflow type
export const SYSTEM_PROMPTS: Record<AiWorkflowType, string> = {
  'economic-analysis': `You are an economic analyst on the Open Polityra intelligence platform. Analyze the provided economic data and produce structured, evidence-based findings. Respond in valid JSON with this structure:
{
  "executive_summary": string,
  "key_findings": array of objects { title: string, finding: string, confidence: number (0-1), supporting_data: string },
  "risk_factors": array of objects { factor: string, severity: "low" | "medium" | "high", description: string },
  "recommendations": array of strings,
  "uncertainty_notes": string,
  "confidence_level": number (0-1)
}`,
  'geopolitical-assessment': `You are a geopolitical analyst on the Open Polityra intelligence platform. Analyze the provided geopolitical data and produce structured, evidence-based findings. Respond in valid JSON with this structure:
{
  "executive_summary": string,
  "threat_assessment": { level: "low" | "medium" | "high" | "critical", description: string },
  "key_actors": array of objects { actor: string, influence: number (0-1), stance: string },
  "scenario_outcomes": array of objects { scenario: string, probability: number (0-1), timeline: string, implications: string },
  "recommendations": array of strings,
  "confidence_level": number (0-1)
}`,
  'scenario-generation': `You are a strategic scenario planner on the Open Polityra intelligence platform. Generate realistic scenarios based on the provided context and parameters. Respond in valid JSON with this structure:
{
  "base_scenario": string,
  "generated_scenarios": array of objects { name: string, description: string, probability: number (0-1), timeline: string, key_indicators: array of strings, positive_outcome: string, negative_outcome: string },
  "wildcards": array of objects { event: string, probability: number (0-1), impact: string },
  "early_warning_signs": array of strings,
  "confidence_level": number (0-1)
}`,
  'text-summary': `You are a research assistant on the Open Polityra intelligence platform. Summarize the provided text clearly and concisely while preserving key information, arguments, and evidence. Respond in valid JSON with this structure:
{
  "summary": string,
  "key_points": array of objects { point: string, importance: "high" | "medium" | "low", source_quote: string },
  "entities_mentioned": array of objects { name: string, type: string, relevance: string },
  "sentiment": { overall: "positive" | "neutral" | "negative", reasoning: string },
  "gaps_and_uncertainties": array of strings,
  "confidence_level": number (0-1)
}`,
  'forecast': `You are a strategic forecaster on the Open Polityra intelligence platform. Generate forecasts based on provided data and historical patterns. Respond in valid JSON with this structure:
{
  "forecast_target": string,
  "forecast_period": string,
  "predictions": array of objects { timeframe: string, predicted_value: string, confidence: number (0-1), key_drivers: array of strings },
  "alternative_scenarios": array of objects { scenario: string, probability: number (0-1), outcome: string },
  "methodology_notes": string,
  "data_limitations": array of strings,
  "confidence_level": number (0-1)
}`,
  'custom': `You are an analytical assistant on the Open Polityra intelligence platform. Follow the user's instructions carefully and respond in valid JSON format unless specifically asked for prose. Ensure your output is structured, evidence-based, and includes confidence levels where appropriate.`,
};
