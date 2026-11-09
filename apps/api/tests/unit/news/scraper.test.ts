import { describe, expect, it } from "vitest";
import { assertFeedDocument, parseFeed, validateFeedUrl } from "../../../src/modules/news/scraper";
import { createSourceSchema } from "../../../src/modules/sources/schema";

describe("news feed scraper safety and parsing", () => {
  it("accepts same-domain HTTPS feed URLs only", async () => {
    await expect(validateFeedUrl("https://8.8.8.8/news.xml", "8.8.8.8")).resolves.toMatchObject({
      hostname: "8.8.8.8",
      protocol: "https:",
    });
    await expect(
      validateFeedUrl("http://feeds.example.org/news.xml", "example.org"),
    ).rejects.toThrow("HTTPS");
    await expect(validateFeedUrl("https://example.net/feed.xml", "example.org")).rejects.toThrow(
      "source domain",
    );
    await expect(validateFeedUrl("https://127.0.0.1/feed.xml", "127.0.0.1")).rejects.toThrow(
      "Private or reserved",
    );
  });

  it("parses RSS entries and ignores links outside the configured source domain", () => {
    const xml = `<?xml version="1.0"?>
      <rss><channel>
        <item><title>Conflict update &amp; briefing</title><link>https://news.example.org/story/1</link>
          <guid>story-1</guid><pubDate>Wed, 05 Nov 2026 08:00:00 GMT</pubDate>
          <description><![CDATA[<p>Publisher summary.</p>]]></description></item>
        <item><title>External link</title><link>https://other.example.net/story/2</link></item>
      </channel></rss>`;

    expect(parseFeed(xml, "example.org")).toEqual([
      {
        externalId: "story-1",
        title: "Conflict update & briefing",
        summary: "Publisher summary.",
        url: "https://news.example.org/story/1",
        publishedAt: new Date("Wed, 05 Nov 2026 08:00:00 GMT"),
      },
    ]);
  });

  it("rejects website HTML when a feed URL is configured", () => {
    expect(() =>
      assertFeedDocument("<!doctype html><html><body>News</body></html>", "text/html"),
    ).toThrow("RSS/Atom XML feed");
    expect(() =>
      assertFeedDocument('<?xml version="1.0"?><rss><channel/></rss>', "application/rss+xml"),
    ).not.toThrow();
    expect(() =>
      assertFeedDocument('<feed xmlns="http://www.w3.org/2005/Atom"/>', "application/atom+xml"),
    ).not.toThrow();
  });

  it("parses Atom entries with href links", () => {
    const xml = `<feed><entry><title>Cybersecurity bulletin</title>
      <link rel="alternate" href="https://example.org/advisory/3"/>
      <id>bulletin-3</id><updated>2026-11-05T08:00:00Z</updated>
    </entry></feed>`;
    expect(parseFeed(xml, "example.org")[0]).toMatchObject({
      externalId: "bulletin-3",
      title: "Cybersecurity bulletin",
      url: "https://example.org/advisory/3",
    });
  });

  it("decodes an Atom href exactly once", () => {
    const xml = `<feed><entry><title>Encoded link</title>
      <link rel="alternate" href="https://example.org/story?value=a&amp;amp;b"/>
    </entry></feed>`;

    expect(parseFeed(xml, "example.org")[0]?.url).toBe("https://example.org/story?value=a&amp;b");
  });

  it("handles repeated unterminated XML opening delimiters", () => {
    const malformedSummary = "<".repeat(10_000) + "summary";
    const xml = `<rss><channel><item><title>Update</title>
      <link>https://example.org/story/4</link>
      <description>${malformedSummary}</description>
    </item></channel></rss>`;

    expect(parseFeed(xml, "example.org")[0]?.summary).toBe(malformedSummary.slice(0, 8000));
  });

  it("requires HTTPS feed and source URLs with matching domains and relevant categories", () => {
    const source = {
      name: "Example feed",
      dataType: "api",
      category: "security",
      canonicalUrl: "https://example.org",
      feedUrl: "https://feeds.example.org/rss.xml",
      topics: ["cybersecurity"],
    };
    expect(createSourceSchema.safeParse(source).success).toBe(true);
    expect(
      createSourceSchema.safeParse({ ...source, feedUrl: "http://feeds.example.org/rss.xml" })
        .success,
    ).toBe(false);
    expect(
      createSourceSchema.safeParse({ ...source, feedUrl: "https://other.example.net/rss.xml" })
        .success,
    ).toBe(false);
    expect(createSourceSchema.safeParse({ ...source, category: "economic" }).success).toBe(false);
  });
});
