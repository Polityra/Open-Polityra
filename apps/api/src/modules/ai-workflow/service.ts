import { AppError } from "../../errors/appError";
import { generateChat, checkOllamaStatus } from "../../services/ollamaService";
import { SYSTEM_PROMPT, type CreateWorkflowInput, type ReviewWorkflowInput } from "./schema";
import { AiWorkflowRepository, WorkflowTaskRepository } from "./repository";
import {
  buildFiscalEvidence,
  buildSourceEvidence,
  renderEvidenceForPrompt,
  type EvidencePack,
} from "./evidence";
import { evidenceCoverage, verifyExplanation } from "./verification";

let cachedRepo: AiWorkflowRepository | null = null;
let cachedTaskRepo: WorkflowTaskRepository | null = null;

function _getRepo(): AiWorkflowRepository {
  return cachedRepo ?? (cachedRepo = new AiWorkflowRepository());
}
function _getTaskRepo(): WorkflowTaskRepository {
  return cachedTaskRepo ?? (cachedTaskRepo = new WorkflowTaskRepository());
}

export const RESULT_SCHEMA_VERSION = 2;

export interface WorkflowRunResult {
  workflowId: string;
  status: string;
  tasksCompleted: number;
  totalTasks: number;
  totalTimeMs: number;
  model: string;
  verification: "passed" | "flagged";
}

function methodologyFor(input: CreateWorkflowInput): string[] {
  const shared = [
    "The AI model only writes an explanation of the numbered evidence items; it is instructed to cite them, quote numbers exactly and add no outside facts.",
    "A mechanical check compares every citation and number in the draft against the evidence. It cannot prove that a statement is true.",
    "No output is treated as verified until a person reviews it.",
  ];
  if (input.type === "fiscal-explanation") {
    return [
      "Observations come from the checked-in Eurostat snapshot (gov_10dd_edpt1) and are validated before use.",
      "Changes, extremes and scenario paths are calculated deterministically in code, not by the AI model.",
      ...shared,
    ];
  }
  return [
    "The text you supplied is split into numbered passages; it is treated as data, not as instructions.",
    ...shared,
  ];
}

function uncertaintyFor(input: CreateWorkflowInput): string[] {
  const shared = [
    "The AI draft can misread or mis-phrase evidence even when the mechanical check passes.",
    "Evidence coverage measures how many statements cite evidence, not how likely they are to be correct.",
  ];
  if (input.type === "fiscal-explanation") {
    return [
      "Eurostat can revise published figures.",
      "Scenarios are illustrative calculations, not forecasts; no probability or confidence interval is attached.",
      ...shared,
    ];
  }
  return ["The supplied text has not been verified against its original publication.", ...shared];
}

async function gatherEvidence(input: CreateWorkflowInput): Promise<EvidencePack> {
  if (input.type === "fiscal-explanation") {
    return buildFiscalEvidence(input.parameters.scenario, input.parameters.question);
  }
  return buildSourceEvidence(input.parameters);
}

function buildUserPrompt(pack: EvidencePack): string {
  return `Question: ${pack.question}\n\n<evidence>\n${renderEvidenceForPrompt(pack)}\n</evidence>\n\nWrite the explanation now, citing evidence ids after each factual statement.`;
}

/**
 * Runs the documented analysis pipeline: evidence -> statistical processing -> AI synthesis ->
 * verification. Every step is stored as a task so the full path can be inspected afterwards.
 */
export async function executeWorkflow(
  userId: string,
  input: CreateWorkflowInput,
): Promise<WorkflowRunResult> {
  const repo = _getRepo();
  const taskRepo = _getTaskRepo();

  const ollamaStatus = await checkOllamaStatus();
  if (!ollamaStatus.available || !ollamaStatus.provider || !ollamaStatus.selectedModel) {
    throw new AppError(
      503,
      "ollama_unavailable",
      `Local Ollama model ${ollamaStatus.selectedModel || "olmo-3:7b"} is unavailable. Start Ollama and pull the configured model.`,
    );
  }

  const workflow = await repo.create({
    userId,
    title: input.title,
    type: input.type,
    description: input.parameters.question ?? "",
    model: ollamaStatus.selectedModel,
    provider: ollamaStatus.provider,
    systemPrompt: SYSTEM_PROMPT,
    parameters: input.parameters,
  });
  await repo.updateStatus(workflow.id, "running", { startedAt: new Date() });

  const startTime = Date.now();
  let completed = 0;
  const totalTasks = 4;

  async function step<T>(
    order: number,
    title: string,
    description: string,
    run: () => Promise<{ value: T; response: string | Record<string, unknown>; prompt?: string }>,
  ): Promise<T> {
    const task = await taskRepo.create({
      workflowId: workflow.id,
      title,
      description,
      stepOrder: order,
    });
    await taskRepo.update(task.id, "running", { startedAt: new Date() });
    try {
      const out = await run();
      await taskRepo.update(task.id, "completed", {
        response: out.response,
        completedAt: new Date(),
      });
      completed += 1;
      return out.value;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await taskRepo.update(task.id, "failed", {
        response: { error: message },
        completedAt: new Date(),
        errorMessage: message.slice(0, 2048),
      });
      await repo.updateStatus(workflow.id, "failed", {
        result: { tasks_completed: completed },
        errorMessage: `Step "${title}" failed: ${message.slice(0, 512)}`,
        completedAt: new Date(),
      });
      if (err instanceof AppError) throw err;
      throw new AppError(500, "workflow_task_error", `Step "${title}" failed: ${message}`);
    }
  }

  const pack = await step(
    1,
    "Evidence pack",
    "Collect numbered, sourced evidence items",
    async () => {
      const value = await gatherEvidence(input);
      return { value, response: { question: value.question, items: value.items } };
    },
  );

  await step(
    2,
    "Statistical processing",
    "Deterministic calculations, no AI involved",
    async () => ({
      value: pack.statistics,
      response: pack.statistics,
    }),
  );

  const draft = await step(
    3,
    "AI explanation draft",
    "Local model explains the evidence",
    async () => {
      const prompt = buildUserPrompt(pack);
      const response = await generateChat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        { model: workflow.model, provider: ollamaStatus.provider!, format: "text" },
      );
      return { value: response.content.trim(), response: response.content, prompt };
    },
  );

  const verification = await step(
    4,
    "Verification",
    "Check citations and numbers against the evidence",
    async () => {
      const report = verifyExplanation(draft, pack);
      return { value: report, response: { ...report } };
    },
  );

  const coverage = evidenceCoverage(verification);
  const result = {
    schema_version: RESULT_SCHEMA_VERSION,
    workflow_type: input.type,
    question: pack.question,
    summary: draft,
    evidence: pack.items,
    statistics: pack.statistics,
    verification,
    evidence_coverage: coverage,
    methodology: methodologyFor(input),
    uncertainty: uncertaintyFor(input),
    limitations: pack.limitations,
    is_forecast: false,
    review: { status: "pending", decided_by: null, decided_at: null, note: null },
    generated_by: { model: workflow.model, provider: workflow.provider },
    generated_at: new Date().toISOString(),
  };

  await repo.updateStatus(workflow.id, "completed", { result, completedAt: new Date() });

  return {
    workflowId: workflow.id,
    status: "completed",
    tasksCompleted: completed,
    totalTasks,
    totalTimeMs: Date.now() - startTime,
    model: workflow.model,
    verification: verification.status,
  };
}

type StoredResult = Record<string, unknown> & {
  schema_version?: number;
  review?: { status?: string };
  verification?: { status?: string };
};

/** Records the human decision on an AI draft. Drafts that failed verification cannot be approved. */
export async function reviewWorkflow(
  workflowId: string,
  userId: string,
  input: ReviewWorkflowInput,
) {
  const repo = _getRepo();
  const workflow = await repo.findById(workflowId);
  if (!workflow || workflow.user_id !== userId) {
    throw new AppError(404, "not_found", "Workflow not found");
  }

  const result = workflow.result as StoredResult | null;
  if (workflow.status !== "completed" || result?.schema_version !== RESULT_SCHEMA_VERSION) {
    throw new AppError(409, "not_reviewable", "Only completed analyses can be reviewed.");
  }
  if (result.review?.status !== "pending") {
    throw new AppError(409, "already_reviewed", "This analysis has already been reviewed.");
  }
  if (input.decision === "approved" && result.verification?.status !== "passed") {
    throw new AppError(
      409,
      "verification_failed",
      "An analysis that failed verification cannot be approved. Reject it instead.",
    );
  }

  const updated = await repo.updateResult(workflowId, {
    ...result,
    review: {
      status: input.decision,
      decided_by: userId,
      decided_at: new Date().toISOString(),
      note: input.note ?? null,
    },
  });
  return updated;
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

  const result = await repo.updateStatus(workflowId, "cancelled", { completedAt: new Date() });
  return !!result;
}
