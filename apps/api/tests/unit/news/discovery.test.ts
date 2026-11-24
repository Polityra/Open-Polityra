import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchDocument = vi.hoisted(() => vi.fn());
vi.mock("../../../src/modules/news/scraper", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../src/modules/news/scraper")>();
  return { ...original, fetchPublicDocument: fetchDocument };
});

import { discoverFeed, feedLinks } from "../../../src/modules/news/discovery";

describe("feed discovery", () => {
  beforeEach(() => {
    fetchDocument.mockReset();
  });

  it("extracts relative RSS and Atom links regardless of attribute order", () => {
    expect(
      feedLinks(
        `<link href="/updates.xml?a=1&amp;b=2" type="application/rss+xml" rel="alternate">
         <link rel="alternate" href="/atom" type="application/atom+xml">`,
        "https://example.org/news",
      ),
    ).toEqual(["https://example.org/updates.xml?a=1&b=2", "https://example.org/atom"]);
  });

  it("replaces a broken preferred feed with a verified advertised feed", async () => {
    fetchDocument.mockImplementation(async (url: string) => {
      if (url === "https://example.org/") {
        return {
          body: `<html><link rel="alternate" type="application/rss+xml" href="/real.xml"></html>`,
          contentType: "text/html",
        };
      }
      if (url.endsWith("/real.xml")) {
        return { body: "<rss><channel/></rss>", contentType: "application/rss+xml" };
      }
      return { body: "<html>Not a feed</html>", contentType: "text/html" };
    });
    await expect(discoverFeed("https://example.org/", "https://example.org/rss.xml")).resolves.toBe(
      "https://example.org/real.xml",
    );
    expect(fetchDocument).toHaveBeenCalledWith(
      "https://example.org/real.xml",
      "example.org",
      2_500,
    );
  });

  it("reports failure rather than treating HTML as a feed", async () => {
    fetchDocument.mockResolvedValue({ body: "<html>Not a feed</html>", contentType: "text/html" });
    await expect(discoverFeed("https://example.org/")).rejects.toThrow("Could not discover");
  });
});
