import { createHash } from "node:crypto";
import { AppError } from "../../errors/appError";
import { generateChat, checkOllamaStatus } from "../../services/ollamaService";
import { SYSTEM_PROMPTS, AI_WORKFLOW_TYPES, type AiWorkflowType } from "./schema";
import {
  AiWorkflowRepository,
  WorkflowTaskRepository,
  AiConversationRepository,
} from "./repository";
import type { WorkflowTaskRow } from "./repository";
import { createHash } from "node:crypto";
import { AppError } from "../../errors/appError";
import { generateChat, checkOllamaStatus } from "../../services/ollamaService";
import { SYSTEM_PROMPTS, AI_WORKFLOW_TYPES, type AiWorkflowType } from "./schema";
import {
  AiWorkflowRepository,
  WorkflowTaskRepository,
  AiConversationRepository,
} from "./repository";
import type { WorkflowTaskRow } from "./repository";

let cachedRepo: AiWorkflowRepository | null = null;
let cachedTaskRepo: WorkflowTaskRepository | null = null;
let cachedConvRepo: AiConversationRepository | null = null;

function _getRepo(): AiWorkflowRepository {
  return cachedRepo ?? (cachedRepo = new AiWorkflowRepository());
}
function _getTaskRepo(): WorkflowTaskRepository {
  return cachedTaskRepo ?? (cachedTaskRepo = new WorkflowTaskRepository());
}
function _getConvRepo(): AiConversationRepository {
  return cachedConvRepo ?? (cachedConvRepo = new AiConversationRepository());
}
function _getRepo(): AiWorkflowRepository {
  return cachedRepo ?? (cachedRepo = new AiWorkflowRepository());
}
function _getTaskRepo(): WorkflowTaskRepository {
  return cachedTaskRepo ?? (cachedTaskRepo = new WorkflowTaskRepository());
}
function _getConvRepo(): AiConversationRepository {
  return cachedConvRepo ?? (cachedConvRepo = new AiConversationRepository());
}

/* ── Workflow orchestration ────────────────────────────────── */

/**
 * Build the workflow execution plan for a given type. Each plan defines:
 * - stepOrder, title, description, prompt template
 * The service will fill in parameter values at runtime.
 */
function buildWorkflowPlan(
  type: AiWorkflowType,
  parameters: Record<string, unknown>,
): Array<{
function buildWorkflowPlan(
  type: AiWorkflowType,
  parameters: Record<string, unknown>,
): Array<{
  title: string;
  description?: string;
  stepOrder: number;
  prompt: string;
}> {
  const ctx = parameters.context || parameters.input || "";
  const data = parameters.data || "";
  const scope = parameters.scope || "global";
  const ctx = parameters.context || parameters.input || "";
  const data = parameters.data || "";
  const scope = parameters.scope || "global";
  const textOnly = (instructions: string) =>
    `${instructions}\n\nRespond in clear, readable prose. Markdown headings and bullets are fine; do not return JSON or a code block.`;

  switch (type) {
    case "economic-analysis":
    case "economic-analysis":
      return [
        {
          stepOrder: 1,
          title: "Data Assessment",
          description: "Evaluate available economic data",
          prompt: textOnly(
            `Assess the current state of the economy described by this context and data. Explain the important indicators, trends, and limitations.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Cross-Domain Correlation",
          description: "Identify correlations between economic factors",
          prompt: textOnly(
            `Identify meaningful relationships between economic factors, the evidence for each relationship, and their possible market implications. Avoid presenting correlation as causation.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Scenario Analysis",
          description: "Generate possible economic futures",
          prompt: textOnly(
            `Describe plausible baseline, optimistic, and pessimistic economic scenarios, including their assumptions, time horizons, likelihoods, and key risks.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Final Synthesis",
          description: "Aggregate findings into comprehensive report",
          prompt: textOnly(
            `Synthesize the analysis into a concise report with an executive summary, key findings, practical recommendations, and a clear discussion of uncertainty.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
        {
          stepOrder: 1,
          title: "Data Assessment",
          description: "Evaluate available economic data",
          prompt: textOnly(
            `Assess the current state of the economy described by this context and data. Explain the important indicators, trends, and limitations.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Cross-Domain Correlation",
          description: "Identify correlations between economic factors",
          prompt: textOnly(
            `Identify meaningful relationships between economic factors, the evidence for each relationship, and their possible market implications. Avoid presenting correlation as causation.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Scenario Analysis",
          description: "Generate possible economic futures",
          prompt: textOnly(
            `Describe plausible baseline, optimistic, and pessimistic economic scenarios, including their assumptions, time horizons, likelihoods, and key risks.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Final Synthesis",
          description: "Aggregate findings into comprehensive report",
          prompt: textOnly(
            `Synthesize the analysis into a concise report with an executive summary, key findings, practical recommendations, and a clear discussion of uncertainty.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}`,
          ),
        },
      ];

    case "geopolitical-assessment":
    case "geopolitical-assessment":
      return [
        {
          stepOrder: 1,
          title: "Actor Analysis",
          description: "Identify and assess key geopolitical actors",
          prompt: textOnly(
            `Identify the relevant actors, their interests and capabilities, and the relationships and power dynamics between them.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Threat Assessment",
          description: "Assess potential threats and risks",
          prompt: textOnly(
            `Assess the main risks and threats in this context, explaining their sources, likelihood, possible impact, and time horizon. Distinguish risks supported by evidence from speculation.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Scenario Generation",
          description: "Generate geopolitical scenarios",
          prompt: textOnly(
            `Describe plausible geopolitical scenarios, the assumptions and developments behind each, their implications, and indicators that could signal a change in direction.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Strategic Recommendations",
          description: "Generate actionable recommendations",
          prompt: textOnly(
            `Write an executive summary and proportionate recommendations. Explain the rationale, relevant time horizon, resource considerations, and risks for each recommendation.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
        {
          stepOrder: 1,
          title: "Actor Analysis",
          description: "Identify and assess key geopolitical actors",
          prompt: textOnly(
            `Identify the relevant actors, their interests and capabilities, and the relationships and power dynamics between them.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Threat Assessment",
          description: "Assess potential threats and risks",
          prompt: textOnly(
            `Assess the main risks and threats in this context, explaining their sources, likelihood, possible impact, and time horizon. Distinguish risks supported by evidence from speculation.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Scenario Generation",
          description: "Generate geopolitical scenarios",
          prompt: textOnly(
            `Describe plausible geopolitical scenarios, the assumptions and developments behind each, their implications, and indicators that could signal a change in direction.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Strategic Recommendations",
          description: "Generate actionable recommendations",
          prompt: textOnly(
            `Write an executive summary and proportionate recommendations. Explain the rationale, relevant time horizon, resource considerations, and risks for each recommendation.\n\nContext: ${ctx}\n\nScope: ${scope}`,
          ),
        },
      ];

    case "scenario-generation":
    case "scenario-generation":
      return [
        {
          stepOrder: 1,
          title: "Context Analysis",
          description: "Understand the situation context",
          prompt: textOnly(
            `Analyze the situation for scenario planning. Explain its current state, important variables, and forces that could shape change.\n\nContext: ${ctx}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Scenario Development",
          description: "Develop plausible scenarios",
          prompt: textOnly(
            `Develop a range of plausible scenarios. For each, explain its narrative, assumptions, timeline, triggering events, and potential outcomes.\n\nContext: ${ctx}\n\nKey Variables:\n${JSON.stringify(parameters.key_variables || [])}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Impact Assessment",
          description: "Assess scenario impacts",
          prompt: textOnly(
            `Assess how the scenarios could affect sectors and stakeholders, including possible cascading effects and indicators worth monitoring.\n\nContext: ${ctx}\n\nScenarios:\n${JSON.stringify(parameters.scenarios || [])}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Response Planning",
          description: "Generate response strategies",
          prompt: textOnly(
            `Describe proportionate response strategies for the scenarios, including implementation steps, resources, timelines, success measures, and contingency plans.\n\nContext: ${ctx}\n\nScenarios:\n${JSON.stringify(parameters.scenarios || [])}`,
          ),
        },
        {
          stepOrder: 1,
          title: "Context Analysis",
          description: "Understand the situation context",
          prompt: textOnly(
            `Analyze the situation for scenario planning. Explain its current state, important variables, and forces that could shape change.\n\nContext: ${ctx}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Scenario Development",
          description: "Develop plausible scenarios",
          prompt: textOnly(
            `Develop a range of plausible scenarios. For each, explain its narrative, assumptions, timeline, triggering events, and potential outcomes.\n\nContext: ${ctx}\n\nKey Variables:\n${JSON.stringify(parameters.key_variables || [])}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Impact Assessment",
          description: "Assess scenario impacts",
          prompt: textOnly(
            `Assess how the scenarios could affect sectors and stakeholders, including possible cascading effects and indicators worth monitoring.\n\nContext: ${ctx}\n\nScenarios:\n${JSON.stringify(parameters.scenarios || [])}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Response Planning",
          description: "Generate response strategies",
          prompt: textOnly(
            `Describe proportionate response strategies for the scenarios, including implementation steps, resources, timelines, success measures, and contingency plans.\n\nContext: ${ctx}\n\nScenarios:\n${JSON.stringify(parameters.scenarios || [])}`,
          ),
        },
      ];

    case "text-summary":
    case "text-summary":
      return [
        {
          stepOrder: 1,
          title: "Content Analysis",
          description: "Analyze the structure and key elements",
          prompt: textOnly(
            `Identify the text's main topic, structure, important sections, and notable people or organizations.\n\nText:\n${ctx}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Summary Generation",
          description: "Generate comprehensive summary",
          prompt: textOnly(
            `Write a comprehensive summary that explains the main argument, supporting evidence, and any relevant counterarguments or limitations.\n\nText:\n${ctx}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Insight Extraction",
          description: "Extract actionable insights",
          prompt: textOnly(
            `Explain the text's key insights and implications, and identify gaps, uncertainties, and useful follow-up questions.\n\nText:\n${ctx}`,
          ),
        },
        {
          stepOrder: 1,
          title: "Content Analysis",
          description: "Analyze the structure and key elements",
          prompt: textOnly(
            `Identify the text's main topic, structure, important sections, and notable people or organizations.\n\nText:\n${ctx}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Summary Generation",
          description: "Generate comprehensive summary",
          prompt: textOnly(
            `Write a comprehensive summary that explains the main argument, supporting evidence, and any relevant counterarguments or limitations.\n\nText:\n${ctx}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Insight Extraction",
          description: "Extract actionable insights",
          prompt: textOnly(
            `Explain the text's key insights and implications, and identify gaps, uncertainties, and useful follow-up questions.\n\nText:\n${ctx}`,
          ),
        },
      ];

    case "forecast":
    case "forecast":
      return [
        {
          stepOrder: 1,
          title: "Trend Analysis",
          description: "Analyze historical trends and patterns",
          prompt: textOnly(
            `Analyze the historical data for trends, patterns, and seasonality. Explain their direction, strength, and time horizon.\n\nContext: ${ctx}\n\nHistorical Data:\n${data}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Driver Identification",
          description: "Identify key influencing factors",
          prompt: textOnly(
            `Identify the main factors that could influence the forecast target, how they may affect it, and any external factors to consider.\n\nContext: ${ctx}\n\nTrends:\n${JSON.stringify(parameters.trends || [])}\n\nTarget: ${parameters.target || "unspecified"}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Forecast Generation",
          description: "Generate predictions with confidence intervals",
          prompt: textOnly(
            `Describe likely outcomes and alternatives for the target and time horizon. Explain assumptions and the basis for your uncertainty estimates.\n\nContext: ${ctx}\n\nKey Drivers:\n${JSON.stringify(parameters.drivers || [])}\n\nTarget to forecast: ${parameters.target || "unspecified"}\nTime horizon: ${parameters.time_horizon || "6-12 months"}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Confidence Assessment",
          description: "Assess forecast reliability and limitations",
          prompt: textOnly(
            `Assess the reliability and limitations of the forecast. Explain the main sources of uncertainty and recommend indicators to monitor.\n\nContext: ${ctx}\n\nForecasts:\n${JSON.stringify(parameters.forecasts || [])}`,
          ),
        },
        {
          stepOrder: 1,
          title: "Trend Analysis",
          description: "Analyze historical trends and patterns",
          prompt: textOnly(
            `Analyze the historical data for trends, patterns, and seasonality. Explain their direction, strength, and time horizon.\n\nContext: ${ctx}\n\nHistorical Data:\n${data}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
        {
          stepOrder: 2,
          title: "Driver Identification",
          description: "Identify key influencing factors",
          prompt: textOnly(
            `Identify the main factors that could influence the forecast target, how they may affect it, and any external factors to consider.\n\nContext: ${ctx}\n\nTrends:\n${JSON.stringify(parameters.trends || [])}\n\nTarget: ${parameters.target || "unspecified"}`,
          ),
        },
        {
          stepOrder: 3,
          title: "Forecast Generation",
          description: "Generate predictions with confidence intervals",
          prompt: textOnly(
            `Describe likely outcomes and alternatives for the target and time horizon. Explain assumptions and the basis for your uncertainty estimates.\n\nContext: ${ctx}\n\nKey Drivers:\n${JSON.stringify(parameters.drivers || [])}\n\nTarget to forecast: ${parameters.target || "unspecified"}\nTime horizon: ${parameters.time_horizon || "6-12 months"}`,
          ),
        },
        {
          stepOrder: 4,
          title: "Confidence Assessment",
          description: "Assess forecast reliability and limitations",
          prompt: textOnly(
            `Assess the reliability and limitations of the forecast. Explain the main sources of uncertainty and recommend indicators to monitor.\n\nContext: ${ctx}\n\nForecasts:\n${JSON.stringify(parameters.forecasts || [])}`,
          ),
        },
      ];

    case "custom":
    case "custom":
      return [
        {
          stepOrder: 1,
          title: "Analysis",
          description: "Process the request",
          prompt: textOnly(
            `Process this request and any supplied parameters.\n\nUser Request:\n${ctx}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
        {
          stepOrder: 1,
          title: "Analysis",
          description: "Process the request",
          prompt: textOnly(
            `Process this request and any supplied parameters.\n\nUser Request:\n${ctx}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}`,
          ),
        },
      ];
  }
}

/* ── Public API ────────────────────────────────────────────── */

export interface WorkflowRunResult {
  workflowId: string;
  status: string;
  tasksCompleted: number;
  totalTasks: number;
  totalTimeMs: number;
  model: string;
}

/**
 * Execute a full AI workflow — creates tasks, runs them sequentially through Ollama, aggregates results.
 */
export async function executeWorkflow(
  userId: string,
  title: string,
  type: AiWorkflowType,
  parameters: Record<string, unknown>,
  systemPrompt?: string,
): Promise<WorkflowRunResult> {
  const repo = _getRepo();
  const taskRepo = _getTaskRepo();
  // Select the configured local Ollama model.
  const ollamaStatus = await checkOllamaStatus();
  if (!ollamaStatus.available || !ollamaStatus.provider || !ollamaStatus.selectedModel) {
    throw new AppError(
      503,
      "ollama_unavailable",
      `Local Ollama model ${ollamaStatus.selectedModel || "olmo-3:7b"} is unavailable. Start Ollama and pull the configured model.`,
    );
  }

  // Create workflow record
  const workflow = await repo.create({
    userId,
    title,
    type,
    description: (parameters.context as string | undefined) ?? "",
    description: (parameters.context as string | undefined) ?? "",
    model: ollamaStatus.selectedModel,
    provider: ollamaStatus.provider,
    systemPrompt: systemPrompt ?? SYSTEM_PROMPTS[type],
    parameters,
  });

  // Mark as running
  await repo.updateStatus(workflow.id, "running", { startedAt: new Date() });
  await repo.updateStatus(workflow.id, "running", { startedAt: new Date() });

  const startTime = Date.now();
  const plan = buildWorkflowPlan(type, parameters);
  const tasksCompleted: number[] = [];

  for (const step of plan) {
    // Create task
    const task = await taskRepo.create({
      workflowId: workflow.id,
      title: step.title,
      description: step.description,
      stepOrder: step.stepOrder,
      prompt: step.prompt,
    });

    // Mark task running
    await taskRepo.update(task.id, "running", { startedAt: new Date() });
    await taskRepo.update(task.id, "running", { startedAt: new Date() });

    try {
      // Call Ollama via the service layer
      const response = await generateChat(
        [
          {
            role: "system",
            role: "system",
            content: `${systemPrompt ?? SYSTEM_PROMPTS[type]}\n\nReturn the answer as readable prose, not JSON. Do not wrap the response in a JSON object or code block.`,
          },
          { role: "user", content: step.prompt },
          { role: "user", content: step.prompt },
        ],
        { model: workflow.model, provider: ollamaStatus.provider, format: "text" },
        { model: workflow.model, provider: ollamaStatus.provider, format: "text" },
      );

      await taskRepo.update(task.id, "completed", {
      await taskRepo.update(task.id, "completed", {
        response: response.content,
        completedAt: new Date(),
      });

      tasksCompleted.push(step.stepOrder);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await taskRepo.update(task.id, "failed", {
      await taskRepo.update(task.id, "failed", {
        response: { error: errMsg },
        completedAt: new Date(),
        errorMessage: errMsg.slice(0, 2048),
      });

      // Update workflow with partial result
      const partialResult = {
        tasksCompleted: tasksCompleted.length,
        totalTasks: plan.length,
        taskResults: tasksCompleted
          .map((order) => plan.find((s) => s.stepOrder === order)?.title)
          .filter(Boolean),
        taskResults: tasksCompleted
          .map((order) => plan.find((s) => s.stepOrder === order)?.title)
          .filter(Boolean),
        model: workflow.model,
        totalTimeMs: Date.now() - startTime,
      };
      await repo.updateStatus(workflow.id, "failed", {
      await repo.updateStatus(workflow.id, "failed", {
        result: partialResult,
        errorMessage: `Task "${step.title}" failed: ${errMsg.slice(0, 512)}`,
        completedAt: new Date(),
      });

      throw new AppError(
        500,
        "workflow_task_error",
        `Workflow task failed at step "${step.title}": ${errMsg}`,
      );
      throw new AppError(
        500,
        "workflow_task_error",
        `Workflow task failed at step "${step.title}": ${errMsg}`,
      );
    }
  }

  // Aggregate final result from all task responses
  const allTasks = await taskRepo.findByWorkflow(workflow.id);
  const aggregatedResult = aggregateResults(allTasks, type);

  // Update workflow with final result
  await repo.updateStatus(workflow.id, "completed", {
  await repo.updateStatus(workflow.id, "completed", {
    result: aggregatedResult,
    completedAt: new Date(),
  });

  return {
    workflowId: workflow.id,
    status: "completed",
    status: "completed",
    tasksCompleted: tasksCompleted.length,
    totalTasks: plan.length,
    totalTimeMs: Date.now() - startTime,
    model: workflow.model,
  };
}

/**
 * Aggregate task results into a unified output.
 */
function aggregateResults(tasks: WorkflowTaskRow[], type: AiWorkflowType): Record<string, unknown> {
  const taskResults: Array<{
    title: string;
    order: number;
    response: string | Record<string, unknown>;
  }> = tasks.map((t) => ({
  const taskResults: Array<{
    title: string;
    order: number;
    response: string | Record<string, unknown>;
  }> = tasks.map((t) => ({
    title: t.title,
    order: t.step_order,
    response: t.response ?? {},
  }));

  return {
    workflow_type: type,
    tasks_completed: taskResults.length,
    task_results: taskResults,
    summary: generateSummary(taskResults, type),
    confidence_level: calculateConfidence(taskResults),
    generated_at: new Date().toISOString(),
  };
}

function generateSummary(
  results: Array<{ title: string; order: number; response: string | Record<string, unknown> }>,
  type: AiWorkflowType,
): string {
  const completed = results.filter((r) =>
    typeof r.response === "string"
      ? r.response.trim().length > 0
      : Object.keys(r.response).length > 0,
  );
  const lastResult: string | Record<string, unknown> =
    completed[completed.length - 1]?.response ?? {};
function generateSummary(
  results: Array<{ title: string; order: number; response: string | Record<string, unknown> }>,
  type: AiWorkflowType,
): string {
  const completed = results.filter((r) =>
    typeof r.response === "string"
      ? r.response.trim().length > 0
      : Object.keys(r.response).length > 0,
  );
  const lastResult: string | Record<string, unknown> =
    completed[completed.length - 1]?.response ?? {};

  if (typeof lastResult === "string") return lastResult;
  if (type === "economic-analysis" || type === "geopolitical-assessment") {
    return typeof lastResult.executive_summary === "string"
      ? lastResult.executive_summary
      : `Analysis complete across ${completed.length} steps.`;
  if (typeof lastResult === "string") return lastResult;
  if (type === "economic-analysis" || type === "geopolitical-assessment") {
    return typeof lastResult.executive_summary === "string"
      ? lastResult.executive_summary
      : `Analysis complete across ${completed.length} steps.`;
  }
  if (type === "forecast") {
  if (type === "forecast") {
    const forecasts = (lastResult.forecasts || []) as Array<Record<string, unknown>>;
    return typeof forecasts[0] === "object" && forecasts[0]?.predicted_direction != null
      ? `Forecast: ${forecasts.map((f) => `${f.predicted_direction ?? "N/A"} (${f.timeframe ?? "N/A"})`).join("; ")}`
    return typeof forecasts[0] === "object" && forecasts[0]?.predicted_direction != null
      ? `Forecast: ${forecasts.map((f) => `${f.predicted_direction ?? "N/A"} (${f.timeframe ?? "N/A"})`).join("; ")}`
      : `Forecast complete across ${completed.length} steps.`;
  }
  if (type === "scenario-generation") {
  if (type === "scenario-generation") {
    const scenarios = (lastResult.response_strategies || []) as Array<Record<string, unknown>>;
    return typeof scenarios[0] === "object"
      ? `Generated ${scenarios.length} response strategies.`
      : `Scenario planning complete across ${completed.length} steps.`;
    return typeof scenarios[0] === "object"
      ? `Generated ${scenarios.length} response strategies.`
      : `Scenario planning complete across ${completed.length} steps.`;
  }
  return `Analysis complete: ${type}. Processed ${completed.length} of ${results.length} steps successfully.`;
}

function calculateConfidence(
  results: Array<{ title: string; order: number; response: string | Record<string, unknown> }>,
): number {
function calculateConfidence(
  results: Array<{ title: string; order: number; response: string | Record<string, unknown> }>,
): number {
  const confidences = results.flatMap((r) => {
    const c = typeof r.response === "string" ? undefined : r.response.confidence_level;
    return typeof c === "number" && c >= 0 && c <= 1 ? [c] : [];
    const c = typeof r.response === "string" ? undefined : r.response.confidence_level;
    return typeof c === "number" && c >= 0 && c <= 1 ? [c] : [];
  });
  if (confidences.length === 0) return 0.5;
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

/**
 * Resume an in-progress or failed workflow by re-running its remaining tasks.
 */
export async function resumeWorkflow(
  workflowId: string,
  userId: string,
): Promise<WorkflowRunResult> {
export async function resumeWorkflow(
  workflowId: string,
  userId: string,
): Promise<WorkflowRunResult> {
  const repo = _getRepo();
  const taskRepo = _getTaskRepo();

  const workflow = await repo.findById(workflowId);
  if (!workflow) throw new AppError(404, "not_found", "Workflow not found");
  if (workflow.user_id !== userId)
    throw new AppError(403, "forbidden", "Not authorized to resume this workflow");
  if (!workflow) throw new AppError(404, "not_found", "Workflow not found");
  if (workflow.user_id !== userId)
    throw new AppError(403, "forbidden", "Not authorized to resume this workflow");

  // Get tasks that need re-running
  const pendingTasks = await taskRepo.findByWorkflow(workflowId);
  const incompleteTasks = pendingTasks.filter(
    (t) => t.status === "pending" || t.status === "failed",
  );
  const incompleteTasks = pendingTasks.filter(
    (t) => t.status === "pending" || t.status === "failed",
  );

  if (incompleteTasks.length === 0) {
    throw new AppError(400, "workflow_already_complete", "No tasks to resume");
    throw new AppError(400, "workflow_already_complete", "No tasks to resume");
  }

  return executeWorkflow(
    userId,
    workflow.title,
    workflow.type as AiWorkflowType,
    workflow.parameters ?? {},
    workflow.system_prompt ?? undefined,
  );
}

/**
 * Cancel a running workflow.
 */
export async function cancelWorkflow(workflowId: string, userId: string): Promise<boolean> {
  const repo = _getRepo();
  const workflow = await repo.findById(workflowId);
  if (!workflow) throw new AppError(404, "not_found", "Workflow not found");
  if (workflow.user_id !== userId)
    throw new AppError(403, "forbidden", "Not authorized to cancel this workflow");
  if (!workflow) throw new AppError(404, "not_found", "Workflow not found");
  if (workflow.user_id !== userId)
    throw new AppError(403, "forbidden", "Not authorized to cancel this workflow");

  const result = await repo.updateStatus(workflowId, "cancelled", { completedAt: new Date() });
  const result = await repo.updateStatus(workflowId, "cancelled", { completedAt: new Date() });
  return !!result;
}

/**
 * Build a prompt from user input for the AI workflow.
 */
export function buildWorkflowPrompt(
  type: AiWorkflowType,
  userInput: string,
  options?: { context?: string; data?: string },
): string {
export function buildWorkflowPrompt(
  type: AiWorkflowType,
  userInput: string,
  options?: { context?: string; data?: string },
): string {
  const ctx = options?.context || userInput;
  const data = options?.data || "";
  const data = options?.data || "";
  return `${SYSTEM_PROMPTS[type]}\n\n---\nUser Input:\n${ctx}\n\nData:\n${data}`;
}
