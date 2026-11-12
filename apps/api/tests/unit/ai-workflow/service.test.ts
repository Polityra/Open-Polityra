import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createWorkflow: vi.fn(),
  updateStatus: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  findTasks: vi.fn(),
  checkOllamaStatus: vi.fn(),
  generateChat: vi.fn(),
}));

vi.mock("../../../src/modules/ai-workflow/repository", () => ({
  AiWorkflowRepository: class {
    create = mocks.createWorkflow;
    updateStatus = mocks.updateStatus;
  },
  WorkflowTaskRepository: class {
    create = mocks.createTask;
    update = mocks.updateTask;
    findByWorkflow = mocks.findTasks;
  },
  AiConversationRepository: class {},
}));
vi.mock("../../../src/services/ollamaService", () => ({
  checkOllamaStatus: mocks.checkOllamaStatus,
  generateChat: mocks.generateChat,
}));

import { executeWorkflow } from "../../../src/modules/ai-workflow/service";

describe("executeWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes each economic analysis step once", async () => {
    mocks.checkOllamaStatus.mockResolvedValue({
      available: true,
      provider: "ollama",
      selectedModel: "olmo-3:7b",
    });
    mocks.createWorkflow.mockResolvedValue({ id: "workflow", model: "olmo-3:7b" });
    mocks.createTask.mockImplementation(async ({ stepOrder }) => ({ id: `task-${stepOrder}` }));
    mocks.generateChat.mockResolvedValue({ content: "Analysis" });
    mocks.findTasks.mockResolvedValue([]);

    const result = await executeWorkflow("user", "Analysis", "economic-analysis", {
      context: "Context",
    });

    expect(result).toMatchObject({ status: "completed", tasksCompleted: 4, totalTasks: 4 });
    expect(mocks.createTask.mock.calls.map(([task]) => task.stepOrder)).toEqual([1, 2, 3, 4]);
    expect(mocks.generateChat).toHaveBeenCalledTimes(4);
    expect(mocks.updateStatus).toHaveBeenCalledTimes(2);
    expect(mocks.updateTask).toHaveBeenCalledTimes(8);
  });
});
