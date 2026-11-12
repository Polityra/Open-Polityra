import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../../../src/config/database", () => ({ getPool: () => ({ query }) }));

import { AiWorkflowRepository } from "../../../src/modules/ai-workflow/repository";

describe("AiWorkflowRepository", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("applies each filter once and uses the correct pagination parameters", async () => {
    query.mockResolvedValueOnce({ rows: [{ count: "0" }] }).mockResolvedValueOnce({ rows: [] });
    const repository = new AiWorkflowRepository();

    expect(
      await repository.findAll("user", { status: "pending", type: "forecast", limit: 10, offset: 5 }),
    ).toEqual({ rows: [], total: 0 });
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toContain(
      "WHERE aw.user_id = $1 AND aw.status = $2 AND aw.type = $3",
    );
    expect(query.mock.calls[0][1]).toEqual(["user", "pending", "forecast"]);
    expect(query.mock.calls[1][0]).toContain("LIMIT $4 OFFSET $5");
    expect(query.mock.calls[1][1]).toEqual(["user", "pending", "forecast", 10, 5]);
  });

  it("updates each status field once", async () => {
    query.mockResolvedValue({ rows: [] });
    const repository = new AiWorkflowRepository();
    const startedAt = new Date("2026-01-01T00:00:00Z");

    await repository.updateStatus("workflow", "running", { startedAt, result: { ok: true } });

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain(
      "SET status = $1, started_at = $2, result = $3 WHERE id = $4",
    );
    expect(query.mock.calls[0][1]).toEqual(["running", startedAt, '{"ok":true}', "workflow"]);
  });
});
