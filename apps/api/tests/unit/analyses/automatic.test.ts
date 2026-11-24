import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, submitAnalysis } = vi.hoisted(() => ({
  query: vi.fn(),
  submitAnalysis: vi.fn(),
}));
vi.mock("../../../src/config/database", () => ({ getPool: () => ({ query }) }));
vi.mock("../../../src/services/pythonServiceClient", () => ({
  PythonServiceClient: class {
    submitAnalysis = submitAnalysis;
  },
}));

import { processAutomaticAnalyses } from "../../../src/modules/analyses/automatic";

const parameters = {
  kind: "automatic-news",
  title: "News update",
  summary: "Reported event",
  url: "https://example.org/story",
  sourceId: "e0c895e6-a03e-41f3-93a7-d4cb7a1f57a3",
  newsId: "b0fbe926-d648-4ac7-a950-527511a2b11f",
  publishedAt: null,
  topics: ["security"],
};

describe("automatic news analysis", () => {
  beforeEach(() => {
    query.mockReset();
    submitAnalysis.mockReset();
  });

  it("claims a job and saves a shared, source-grounded result", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: "job", parameters }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    submitAnalysis.mockResolvedValue({ topic: "News update", summary: "Summary" });

    expect(await processAutomaticAnalyses()).toBe(1);
    expect(submitAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "News update",
        context: expect.stringContaining(parameters.url),
      }),
    );
    expect(query.mock.calls[1][0]).toContain("status = 'completed'");
    expect(query.mock.calls[1][1][2]).toContain("Summary");
  });

  it("records failures for retry without marking them complete", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: "job", parameters }] })
      .mockResolvedValue({ rows: [] });
    submitAnalysis.mockRejectedValue(new Error("worker unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(await processAutomaticAnalyses()).toBe(1);
      expect(query.mock.calls[1][0]).toContain("status = 'failed'");
      expect(query.mock.calls[1][1][2]).toContain("worker unavailable");
    } finally {
      log.mockRestore();
    }
  });
});
