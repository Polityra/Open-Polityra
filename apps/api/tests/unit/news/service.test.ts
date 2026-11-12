import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, release, connect } = vi.hoisted(() => ({
  query: vi.fn(),
  release: vi.fn(),
  connect: vi.fn(),
}));
vi.mock("../../../src/config/database", () => ({ getPool: () => ({ connect }) }));
import { storeNewsItems } from "../../../src/modules/news/service";

const article = {
  externalId: "article-1",
  title: "Headline",
  summary: "Reported event",
  url: "https://example.org/article",
  publishedAt: null,
};

describe("news ingestion", () => {
  beforeEach(() => {
    query.mockReset();
    release.mockReset();
    connect.mockReset();
    connect.mockResolvedValue({ query, release });
  });

  it("queues a shared analysis in the same transaction as a new article", async () => {
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "news-id" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    expect(await storeNewsItems("source-id", ["security"], [article])).toBe(1);
    expect(query.mock.calls[0][0]).toBe("BEGIN");
    expect(query.mock.calls[2][0]).toContain("INSERT INTO analyses");
    expect(JSON.parse(query.mock.calls[2][1][1])).toMatchObject({
      newsId: "news-id",
      url: article.url,
      kind: "automatic-news",
    });
    expect(query.mock.calls[3][0]).toBe("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });

  it("does not queue a duplicate article", async () => {
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({});
    expect(await storeNewsItems("source-id", ["security"], [article])).toBe(0);
    expect(query.mock.calls.map(([sql]) => sql)).not.toContainEqual(
      expect.stringContaining("INSERT INTO analyses"),
    );
  });

  it("rolls back the article if its analysis cannot be queued", async () => {
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "news-id" }] })
      .mockRejectedValueOnce(new Error("migration missing"))
      .mockResolvedValueOnce({});
    await expect(storeNewsItems("source-id", ["security"], [article])).rejects.toThrow(
      "migration missing",
    );
    expect(query.mock.calls[3][0]).toBe("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });
});
