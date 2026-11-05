import { createHash } from 'node:crypto';
import { AppError } from '../../errors/appError';
import { generateChat, checkOllamaStatus } from '../../services/ollamaService';
import { SYSTEM_PROMPTS, AI_WORKFLOW_TYPES, type AiWorkflowType } from './schema';
import { AiWorkflowRepository, WorkflowTaskRepository, AiConversationRepository } from './repository';
import type { WorkflowTaskRow } from './repository';

let cachedRepo: AiWorkflowRepository | null = null;
let cachedTaskRepo: WorkflowTaskRepository | null = null;
let cachedConvRepo: AiConversationRepository | null = null;

function _getRepo(): AiWorkflowRepository { return cachedRepo ?? (cachedRepo = new AiWorkflowRepository()); }
function _getTaskRepo(): WorkflowTaskRepository { return cachedTaskRepo ?? (cachedTaskRepo = new WorkflowTaskRepository()); }
function _getConvRepo(): AiConversationRepository { return cachedConvRepo ?? (cachedConvRepo = new AiConversationRepository()); }

/* ── Workflow orchestration ────────────────────────────────── */

/**
 * Build the workflow execution plan for a given type. Each plan defines:
 * - stepOrder, title, description, prompt template
 * The service will fill in parameter values at runtime.
 */
function buildWorkflowPlan(type: AiWorkflowType, parameters: Record<string, unknown>): Array<{
  title: string;
  description?: string;
  stepOrder: number;
  prompt: string;
}> {
  const ctx = parameters.context || parameters.input || '';
  const data = parameters.data || '';
  const scope = parameters.scope || 'global';

  switch (type) {
    case 'economic-analysis':
      return [
        { stepOrder: 1, title: 'Data Assessment', description: 'Evaluate available economic data', prompt: `You are an economic analyst. Given the following context and data, assess the current state of the economy described.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}\n\nProvide a structured JSON assessment with: current_state, key_indicators, trends, confidence_level (0-1).` },
        { stepOrder: 2, title: 'Cross-Domain Correlation', description: 'Identify correlations between economic factors', prompt: `You are an economic analyst. Given the following context and data, identify cross-domain correlations.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}\n\nProvide a structured JSON response with: correlated_factors (array of {factor1, factor2, relationship, evidence}), market_implications (array of strings), confidence_level (0-1).` },
        { stepOrder: 3, title: 'Scenario Analysis', description: 'Generate possible economic futures', prompt: `You are an economic analyst. Given the following context and data, generate plausible economic scenarios.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}\n\nProvide a structured JSON response with: base_case (description, probability, timeline), optimistic_scenario (description, probability, timeline), pessimistic_scenario (description, probability, timeline), key_risks (array of strings), confidence_level (0-1).` },
        { stepOrder: 4, title: 'Final Synthesis', description: 'Aggregate findings into comprehensive report', prompt: `You are a senior economic analyst. Based on the following analysis steps, synthesize a comprehensive economic report.\n\nContext: ${ctx}\n\nEconomic Data:\n${data}\n\nProvide a structured JSON executive summary with: executive_summary (paragraph), key_findings (array), strategic_recommendations (array of {action, priority, timeline, expected_impact}), confidence_level (0-1).` },
      ];

    case 'geopolitical-assessment':
      return [
        { stepOrder: 1, title: 'Actor Analysis', description: 'Identify and assess key geopolitical actors', prompt: `You are a geopolitical analyst. Given the following context, identify and analyze the key geopolitical actors.\n\nContext: ${ctx}\n\nScope: ${scope}\n\nProvide a structured JSON response with: key_actors (array of {actor, type, influence, interests, capabilities, stance}), power_dynamics (description), confidence_level (0-1).` },
        { stepOrder: 2, title: 'Threat Assessment', description: 'Assess potential threats and risks', prompt: `You are a geopolitical analyst. Given the following context, assess potential threats.\n\nContext: ${ctx}\n\nScope: ${scope}\n\nProvide a structured JSON response with: threat_level (low|medium|high|critical), primary_threats (array of {source, type, probability, timeline, potential_impact}), secondary_threats (array), confidence_level (0-1).` },
        { stepOrder: 3, title: 'Scenario Generation', description: 'Generate geopolitical scenarios', prompt: `You are a geopolitical analyst. Given the following context, generate strategic scenarios.\n\nContext: ${ctx}\n\nScope: ${scope}\n\nProvide a structured JSON response with: likely_scenarios (array of {scenario_name, description, probability, timeline, outcome_implications}), wildcards (array), early_warning_indicators (array), confidence_level (0-1).` },
        { stepOrder: 4, title: 'Strategic Recommendations', description: 'Generate actionable recommendations', prompt: `You are a senior geopolitical analyst. Based on the analysis of context:\n\nContext: ${ctx}\n\nScope: ${scope}\n\nProvide a structured JSON response with: executive_summary (paragraph), strategic_recommendations (array of {action, rationale, timeline, resource_requirements, risk_level}), confidence_level (0-1).` },
      ];

    case 'scenario-generation':
      return [
        { stepOrder: 1, title: 'Context Analysis', description: 'Understand the situation context', prompt: `You are a scenario planner. Analyze this context for scenario planning.\n\nContext: ${ctx}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}\n\nProvide a structured JSON response with: situation_summary (paragraph), key_variables (array of {variable, current_state, volatility, influence}), driving_forces (array of strings), confidence_level (0-1).` },
        { stepOrder: 2, title: 'Scenario Development', description: 'Develop plausible scenarios', prompt: `You are a scenario planner. Based on this analysis, develop strategic scenarios.\n\nContext: ${ctx}\n\nKey Variables:\n${JSON.stringify(parameters.key_variables || [])}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}\n\nProvide a structured JSON response with: scenarios (array of {name, description, probability, timeline_horizon, key_assumptions, triggering_events, positive_outcome, negative_outcome}), confidence_level (0-1).` },
        { stepOrder: 3, title: 'Impact Assessment', description: 'Assess scenario impacts', prompt: `You are a scenario planner. Assess the impacts of these scenarios.\n\nContext: ${ctx}\n\nScenarios:\n${JSON.stringify(parameters.scenarios || [])}\n\nProvide a structured JSON response with: sectoral_impacts (array of {sector, impact_severity, affected_stakeholders}), cascading_effects (array), monitoring_metrics (array of {metric, threshold, measurement_frequency}), confidence_level (0-1).` },
        { stepOrder: 4, title: 'Response Planning', description: 'Generate response strategies', prompt: `You are a strategic planner. Generate response strategies for these scenarios.\n\nContext: ${ctx}\n\nScenarios:\n${JSON.stringify(parameters.scenarios || [])}\n\nProvide a structured JSON response with: response_strategies (array of {strategy_name, applicable_scenarios, implementation_steps, resource_needs, timeline, success_metrics}), contingency_plans (array), confidence_level (0-1).` },
      ];

    case 'text-summary':
      return [
        { stepOrder: 1, title: 'Content Analysis', description: 'Analyze the structure and key elements', prompt: `You are a research assistant. Analyze this text for its key components.\n\nText:\n${ctx}\n\nProvide a structured JSON response with: main_topic (string), document_type (string), key_sections (array of {section_title, summary}), entities_mentioned (array of {name, type, relevance}), confidence_level (0-1).` },
        { stepOrder: 2, title: 'Summary Generation', description: 'Generate comprehensive summary', prompt: `You are a research assistant. Generate a comprehensive summary of this text.\n\nText:\n${ctx}\n\nProvide a structured JSON response with: executive_summary (paragraph), key_arguments (array of {argument, supporting_evidence, counter_arguments}), supporting_data (array of {data_point, significance}), confidence_level (0-1).` },
        { stepOrder: 3, title: 'Insight Extraction', description: 'Extract actionable insights', prompt: `You are a research assistant. Extract insights and implications from this text.\n\nText:\n${ctx}\n\nProvide a structured JSON response with: key_insights (array of {insight, evidence, implications}), gaps_and_uncertainties (array), action_items (array), confidence_level (0-1).` },
      ];

    case 'forecast':
      return [
        { stepOrder: 1, title: 'Trend Analysis', description: 'Analyze historical trends and patterns', prompt: `You are a strategic forecaster. Analyze the historical data for trends.\n\nContext: ${ctx}\n\nHistorical Data:\n${data}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}\n\nProvide a structured JSON response with: identified_trends (array of {trend, direction, strength, timeframe}), pattern_analysis (description), seasonality_notes (string), confidence_level (0-1).` },
        { stepOrder: 2, title: 'Driver Identification', description: 'Identify key influencing factors', prompt: `You are a strategic forecaster. Identify the key drivers for the target.\n\nContext: ${ctx}\n\nTrends:\n${JSON.stringify(parameters.trends || [])}\n\nTarget: ${parameters.target || 'unspecified'}\n\nProvide a structured JSON response with: primary_drivers (array of {driver, influence_type, current_strength, trajectory_change_probability}), secondary_drivers (array), exogenous_factors (array), confidence_level (0-1).` },
        { stepOrder: 3, title: 'Forecast Generation', description: 'Generate predictions with confidence intervals', prompt: `You are a strategic forecaster. Generate forecasts based on this analysis.\n\nContext: ${ctx}\n\nKey Drivers:\n${JSON.stringify(parameters.drivers || [])}\n\nTarget to forecast: ${parameters.target || 'unspecified'}\nTime horizon: ${parameters.time_horizon || '6-12 months'}\n\nProvide a structured JSON response with: forecasts (array of {timeframe, predicted_direction, confidence_interval_low, confidence_interval_high, key_assumptions}), alternative_outcomes (array of {outcome, probability, conditions}), methodology_notes (string), confidence_level (0-1).` },
        { stepOrder: 4, title: 'Confidence Assessment', description: 'Assess forecast reliability and limitations', prompt: `You are a strategic forecaster. Assess the confidence in these forecasts.\n\nContext: ${ctx}\n\nForecasts:\n${JSON.stringify(parameters.forecasts || [])}\n\nProvide a structured JSON response with: confidence_assessment (high|medium|low), reasoning (paragraph), data_limitations (array of {limitation, impact_on_forecast, mitigation}), monitoring_recommendations (array of {metric, check_frequency, action_threshold}), confidence_level (0-1).` },
      ];

    case 'custom':
      return [
        { stepOrder: 1, title: 'Analysis', description: 'Process the request', prompt: `You are an analytical assistant. Process this request.\n\nUser Request:\n${ctx}\n\nParameters:\n${JSON.stringify(parameters, null, 2)}\n\nProvide your analysis as structured JSON output.` },
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
  model?: string,
  systemPrompt?: string,
): Promise<WorkflowRunResult> {
  const repo = _getRepo();
  const taskRepo = _getTaskRepo();
  // Select an available local model or the configured Ollama Cloud model.
  const ollamaStatus = await checkOllamaStatus(model?.trim() || undefined);
  if (!ollamaStatus.available || !ollamaStatus.provider || !ollamaStatus.selectedModel) {
    throw new AppError(503, 'ollama_unavailable', 'No configured Ollama model is available. Start Ollama with the configured model or configure OLLAMA_API_KEY and OLLAMA_CLOUD_MODEL for cloud fallback.');
  }

  // Create workflow record
  const workflow = await repo.create({
    userId,
    title,
    type,
    description: (parameters.context as string | undefined) ?? '',
    model: ollamaStatus.selectedModel,
    provider: ollamaStatus.provider,
    systemPrompt: systemPrompt ?? SYSTEM_PROMPTS[type],
    parameters,
  });

  // Mark as running
  await repo.updateStatus(workflow.id, 'running', { startedAt: new Date() });

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
    await taskRepo.update(task.id, 'running', { startedAt: new Date() });

    try {
      // Call Ollama via the service layer
      const response = await generateChat(
        [
          { role: 'system', content: systemPrompt ?? SYSTEM_PROMPTS[type] },
          { role: 'user', content: step.prompt },
        ],
        { model: workflow.model, provider: ollamaStatus.provider, format: 'json' },
      );

      // Try to parse the response as JSON for storage
      let parsedResponse: Record<string, unknown> | null = null;
      try {
        parsedResponse = JSON.parse(response.content);
      } catch {
        parsedResponse = { raw_output: response.content };
      }

      await taskRepo.update(task.id, 'completed', {
        response: parsedResponse ?? undefined,
        completedAt: new Date(),
      });

      tasksCompleted.push(step.stepOrder);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await taskRepo.update(task.id, 'failed', {
        response: { error: errMsg },
        completedAt: new Date(),
        errorMessage: errMsg.slice(0, 2048),
      });

      // Update workflow with partial result
      const partialResult = {
        tasksCompleted: tasksCompleted.length,
        totalTasks: plan.length,
        taskResults: tasksCompleted.map((order) => plan.find((s) => s.stepOrder === order)?.title).filter(Boolean),
        model: workflow.model,
        totalTimeMs: Date.now() - startTime,
      };
      await repo.updateStatus(workflow.id, 'failed', {
        result: partialResult,
        errorMessage: `Task "${step.title}" failed: ${errMsg.slice(0, 512)}`,
        completedAt: new Date(),
      });

      throw new AppError(500, 'workflow_task_error', `Workflow task failed at step "${step.title}": ${errMsg}`);
    }
  }

  // Aggregate final result from all task responses
  const allTasks = await taskRepo.findByWorkflow(workflow.id);
  const aggregatedResult = aggregateResults(allTasks, type);

  // Update workflow with final result
  await repo.updateStatus(workflow.id, 'completed', {
    result: aggregatedResult,
    completedAt: new Date(),
  });

  return {
    workflowId: workflow.id,
    status: 'completed',
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
  const taskResults = tasks.map((t) => ({
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

function generateSummary(results: Array<{ title: string; order: number; response: Record<string, unknown> }>, type: AiWorkflowType): string {
  const completed = results.filter((r) => Object.keys(r.response).length > 0);
  const lastResult = completed[completed.length - 1]?.response ?? {};

  if (type === 'economic-analysis' || type === 'geopolitical-assessment') {
    return typeof (lastResult as Record<string, unknown>).executive_summary === 'string' ? String((lastResult as Record<string, unknown>).executive_summary) : `Analysis complete across ${completed.length} steps.`;
  }
  if (type === 'forecast') {
    const forecasts = (lastResult.forecasts || []) as Array<Record<string, unknown>>;
    return typeof forecasts[0] === 'object' && forecasts[0]?.predicted_direction != null
      ? `Forecast: ${forecasts.map((f) => `${(f.predicted_direction ?? 'N/A')} (${(f.timeframe ?? 'N/A')})`).join('; ')}`
      : `Forecast complete across ${completed.length} steps.`;
  }
  if (type === 'scenario-generation') {
    const scenarios = (lastResult.response_strategies || []) as Array<Record<string, unknown>>;
    return typeof scenarios[0] === 'object' ? `Generated ${scenarios.length} response strategies.` : `Scenario planning complete across ${completed.length} steps.`;
  }
  return `Analysis complete: ${type}. Processed ${completed.length} of ${results.length} steps successfully.`;
}

function calculateConfidence(results: Array<{ title: string; order: number; response: Record<string, unknown> }>): number {
  const confidences = results.flatMap((r) => {
    const c = r.response.confidence_level;
    return typeof c === 'number' && c >= 0 && c <= 1 ? [c] : [];
  });
  if (confidences.length === 0) return 0.5;
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

/**
 * Resume an in-progress or failed workflow by re-running its remaining tasks.
 */
export async function resumeWorkflow(workflowId: string, userId: string): Promise<WorkflowRunResult> {
  const repo = _getRepo();
  const taskRepo = _getTaskRepo();

  const workflow = await repo.findById(workflowId);
  if (!workflow) throw new AppError(404, 'not_found', 'Workflow not found');
  if (workflow.user_id !== userId) throw new AppError(403, 'forbidden', 'Not authorized to resume this workflow');

  // Get tasks that need re-running
  const pendingTasks = await taskRepo.findByWorkflow(workflowId);
  const incompleteTasks = pendingTasks.filter((t) => t.status === 'pending' || t.status === 'failed');

  if (incompleteTasks.length === 0) {
    throw new AppError(400, 'workflow_already_complete', 'No tasks to resume');
  }

  return executeWorkflow(userId, workflow.title, workflow.type as AiWorkflowType, workflow.parameters ?? {}, workflow.model, workflow.system_prompt ?? undefined);
}

/**
 * Cancel a running workflow.
 */
export async function cancelWorkflow(workflowId: string, userId: string): Promise<boolean> {
  const repo = _getRepo();
  const workflow = await repo.findById(workflowId);
  if (!workflow) throw new AppError(404, 'not_found', 'Workflow not found');
  if (workflow.user_id !== userId) throw new AppError(403, 'forbidden', 'Not authorized to cancel this workflow');

  const result = await repo.updateStatus(workflowId, 'cancelled', { completedAt: new Date() });
  return !!result;
}

/**
 * Build a prompt from user input for the AI workflow.
 */
export function buildWorkflowPrompt(type: AiWorkflowType, userInput: string, options?: { context?: string; data?: string }): string {
  const ctx = options?.context || userInput;
  const data = options?.data || '';
  return `${SYSTEM_PROMPTS[type]}\n\n---\nUser Input:\n${ctx}\n\nData:\n${data}`;
}
