import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createWorkflow: vi.fn(),
  updateStatus: vi.fn(),
  updateResult: vi.fn(),
  findById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  checkOllamaStatus: vi.fn(),
  generateChat: vi.fn(),
}));

vi.mock("../../../src/modules/ai-workflow/repository", () => ({
  AiWorkflowRepository: class {
    create = mocks.createWorkflow;
    updateStatus = mocks.updateStatus;
    updateResult = mocks.updateResult;
    findById = mocks.findById;
  },
  WorkflowTaskRepository: class {
    create = mocks.createTask;
    update = mocks.updateTask;
  },
  AiConversationRepository: class {},
}));
vi.mock("../../../src/services/ollamaService", () => ({
  checkOllamaStatus: mocks.checkOllamaStatus,
  generateChat: mocks.generateChat,
}));

import { executeWorkflow, reviewWorkflow } from "../../../src/modules/ai-workflow/service";
import { verifyExplanation } from "../../../src/modules/ai-workflow/verification";
import { buildSourceEvidence } from "../../../src/modules/ai-workflow/evidence";

const sourceInput = {
  type: "source-summary" as const,
  title: "Budget note",
  parameters: {
    sourceTitle: "Budget note",
    text: "The deficit was 2.5% of GDP in 2023. Debt rose during the same period. ".repeat(4),
  },
};

describe("executeWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkOllamaStatus.mockResolvedValue({
      available: true,
      provider: "ollama",
      selectedModel: "olmo-3:7b",
    });
    mocks.createWorkflow.mockResolvedValue({
      id: "workflow",
      model: "olmo-3:7b",
      provider: "ollama",
    });
    mocks.createTask.mockImplementation(async ({ stepOrder }) => ({ id: `task-${stepOrder}` }));
  });

  it("runs four pipeline steps and stores an unreviewed, cited result", async () => {
    mocks.generateChat.mockResolvedValue({
      content: "The deficit was 2.5% of GDP in 2023 [P1].",
    });

    const result = await executeWorkflow("user", sourceInput as never);

    expect(result.tasksCompleted).toBe(4);
    expect(mocks.generateChat).toHaveBeenCalledTimes(1);
    const stored = mocks.updateStatus.mock.calls.find((c) => c[1] === "completed")![2].result;
    expect(stored.schema_version).toBe(2);
    expect(stored.review.status).toBe("pending");
    expect(stored.is_forecast).toBe(false);
    expect(stored.evidence.length).toBeGreaterThan(0);
  });

  it("flags drafts that cite nothing", async () => {
    mocks.generateChat.mockResolvedValue({ content: "You should cut spending." });
    const result = await executeWorkflow("user", sourceInput as never);
    expect(result.verification).toBe("flagged");
  });

  it("marks the workflow failed when the model call throws", async () => {
    mocks.generateChat.mockRejectedValue(new Error("boom"));
    await expect(executeWorkflow("user", sourceInput as never)).rejects.toThrow();
    expect(mocks.updateStatus.mock.calls.some((c) => c[1] === "failed")).toBe(true);
  });

  it("rejects when Ollama is unavailable", async () => {
    mocks.checkOllamaStatus.mockResolvedValue({ available: false });
    await expect(executeWorkflow("user", sourceInput as never)).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});

describe("reviewWorkflow", () => {
  const base = (verification: string, review = "pending") => ({
    id: "w",
    user_id: "user",
    status: "completed",
    result: {
      schema_version: 2,
      verification: { status: verification },
      review: { status: review },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateResult.mockImplementation(async (_id, r) => ({ result: r }));
  });

  it("records an approval for a passed analysis", async () => {
    mocks.findById.mockResolvedValue(base("passed"));
    await reviewWorkflow("w", "user", { decision: "approved" });
    expect(mocks.updateResult.mock.calls[0][1].review.status).toBe("approved");
  });

  it("refuses to approve a flagged analysis", async () => {
    mocks.findById.mockResolvedValue(base("flagged"));
    await expect(reviewWorkflow("w", "user", { decision: "approved" })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("allows rejecting a flagged analysis", async () => {
    mocks.findById.mockResolvedValue(base("flagged"));
    await reviewWorkflow("w", "user", { decision: "rejected", note: "bad" });
    expect(mocks.updateResult.mock.calls[0][1].review.status).toBe("rejected");
  });

  it("refuses double review and other users", async () => {
    mocks.findById.mockResolvedValue(base("passed", "approved"));
    await expect(reviewWorkflow("w", "user", { decision: "rejected" })).rejects.toMatchObject({
      statusCode: 409,
    });
    mocks.findById.mockResolvedValue(base("passed"));
    await expect(reviewWorkflow("w", "other", { decision: "approved" })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("verifyExplanation", () => {
  const pack = buildSourceEvidence({
    sourceTitle: "Note",
    text: "The deficit was 2.5% of GDP in 2023. ".repeat(5),
    question: "What happened?",
  });

  it("passes cited statements with evidence numbers", () => {
    expect(verifyExplanation("The deficit was 2.5% of GDP [P1].", pack).status).toBe("passed");
  });

  it("flags invented numbers and unknown citations", () => {
    const report = verifyExplanation("The deficit was 9.9% of GDP [P1]. Also [P99].", pack);
    expect(report.status).toBe("flagged");
    expect(report.invalid_citations).toContain("P99");
  });
});
