import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { getPool } from "../../config/database";
import type { NewsTopic, IngestedNewsItem } from "./service";
import {
  assertNewsSchema,
  NewsSchemaMissingError,
  pruneExpiredNewsItems,
  storeNewsItems,
} from "./service";

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_ITEMS_PER_FEED = 20;
const SCRAPE_INTERVAL_MS = 15 * 60 * 1000;

interface ScrapeSource {
  id: string;
  name: string;
  category: string;
  canonical_url: string | null;
  metadata: Record<string, unknown> | null;
}

interface FeedConfig {
  enabled: boolean;
  feedUrl: string;
  topics: NewsTopic[];
}

function isPublicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255))
    return false;
  const [a, b] = parts;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 88 && parts[2] === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && parts[2] === 100) ||
    (a === 203 && b === 0 && parts[2] === 113)
  );
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) return isPublicIpv4(normalized.slice(7));
  const firstHextet = Number.parseInt(normalized.split(":")[0] || "0", 16);
  return (
    firstHextet >= 0x2000 &&
    firstHextet <= 0x3fff &&
    !normalized.startsWith("2001:db8:") &&
    !normalized.startsWith("2001:0:") &&
    !normalized.startsWith("2002:")
  );
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^<>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, decimal: string) =>
      String.fromCodePoint(parseInt(decimal, 10)),
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? decodeXml(match[1]) : "";
}

export function parseFeed(xml: string, allowedHost: string): IngestedNewsItem[] {
  const entries = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];
  const items: IngestedNewsItem[] = [];
  for (const [, kind, entry] of entries.slice(0, MAX_ITEMS_PER_FEED)) {
    const title = tagValue(entry, "title");
    const atomHref =
      kind.toLowerCase() === "entry"
        ? entry.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i)?.[1]
        : undefined;
    const rawLink = atomHref === undefined ? tagValue(entry, "link") : decodeXml(atomHref);
    if (!title || !rawLink) continue;

    let url: URL;
    try {
      url = new URL(rawLink);
    } catch {
      continue;
    }
    if (
      url.protocol !== "https:" ||
      (url.hostname !== allowedHost && !url.hostname.endsWith(`.${allowedHost}`))
    )
      continue;

    const id = tagValue(entry, kind.toLowerCase() === "entry" ? "id" : "guid") || url.href;
    const rawDate =
      tagValue(entry, "published") ||
      tagValue(entry, "updated") ||
      tagValue(entry, "pubDate") ||
      tagValue(entry, "dc:date");
    const parsedDate = rawDate ? new Date(rawDate) : null;
    items.push({
      externalId: id.slice(0, 2048),
      title: title.slice(0, 1000),
      summary:
        (
          tagValue(entry, "description") ||
          tagValue(entry, "summary") ||
          tagValue(entry, "content")
        ).slice(0, 8000) || null,
      url: url.href,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
    });
  }
  return items;
}

export function assertFeedDocument(xml: string, contentType: string | undefined): void {
  const document = xml.replace(/^\uFEFF/, "").trimStart();
  const isFeedXml = /^(?:<\?xml\b[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<(?:rss|feed|rdf:RDF)\b/i.test(
    document,
  );
  if (!isFeedXml || contentType?.toLowerCase().includes("text/html")) {
    throw new Error(
      `URL did not return an RSS/Atom XML feed${contentType ? ` (content type: ${contentType})` : ""}`,
    );
  }
}

interface ValidatedFeed {
  url: URL;
  address: string;
  family: 4 | 6;
}

async function resolveFeed(feedUrl: string, domain: string): Promise<ValidatedFeed> {
  let url: URL;
  try {
    url = new URL(feedUrl);
  } catch {
    throw new Error("Feed URL must be a valid HTTPS URL");
  }
  const hostname = url.hostname.toLowerCase();
  const allowedDomain = domain.toLowerCase().replace(/^www\./, "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    (hostname !== allowedDomain && !hostname.endsWith(`.${allowedDomain}`))
  ) {
    throw new Error(
      "Feed must use HTTPS and belong to the configured source domain or a subdomain",
    );
  }
  if (isIP(hostname)) {
    if (!isPublicIpv4(hostname) && !isPublicIpv6(hostname))
      throw new Error("Private or reserved feed hosts are not allowed");
    return { url, address: hostname, family: isIP(hostname) as 4 | 6 };
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) =>
      family === 4 ? !isPublicIpv4(address) : !isPublicIpv6(address),
    )
  ) {
    throw new Error("Feed domain must resolve only to public IP addresses");
  }
  const resolved = addresses[0];
  return { url, address: resolved.address, family: resolved.family as 4 | 6 };
}

export async function validateFeedUrl(feedUrl: string, domain: string): Promise<URL> {
  return (await resolveFeed(feedUrl, domain)).url;
}

function getFeedConfig(source: ScrapeSource): FeedConfig | null {
  const config = source.metadata?.news_scraper;
  if (typeof config !== "object" || config === null) return null;
  const feed = config as Record<string, unknown>;
  if (feed.enabled !== true || typeof feed.feedUrl !== "string" || !Array.isArray(feed.topics))
    return null;
  const topics = feed.topics.filter((topic): topic is NewsTopic =>
    ["geopolitics", "conflict", "security", "cybersecurity", "terrorism", "sanctions"].includes(
      String(topic),
    ),
  );
  if (topics.length === 0 || !source.canonical_url) return null;
  return { enabled: true, feedUrl: feed.feedUrl, topics };
}

async function fetchFeed(
  source: ScrapeSource,
  feed: FeedConfig,
): Promise<{ parsed: number; inserted: number }> {
  if (!source.canonical_url) return { parsed: 0, inserted: 0 };
  const domain = new URL(source.canonical_url).hostname.replace(/^www\./, "");
  const { url, address, family } = await resolveFeed(feed.feedUrl, domain);
  const xml = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const request = httpsRequest(
      url,
      {
        headers: {
          Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml",
          "User-Agent": "OpenPolityraNewsBot/1.0 (+public RSS feed reader)",
        },
        timeout: 10_000,
        lookup: (_hostname, options, callback) => {
          if (typeof options === "object" && options.all) {
            callback(null, [{ address, family }]);
          } else {
            callback(null, address, family);
          }
        },
      },
      (response) => {
        const declaredLength = Number(response.headers["content-length"] ?? 0);
        if (declaredLength > MAX_FEED_BYTES) {
          fail(new Error("Feed exceeds the 2 MB response limit"));
          response.destroy();
          return;
        }
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          fail(new Error(`Feed returned HTTP ${response.statusCode ?? "unknown"}`));
          response.resume();
          return;
        }
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        response.on("data", (chunk: Buffer | string) => {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          totalBytes += bytes.byteLength;
          if (totalBytes > MAX_FEED_BYTES) {
            fail(new Error("Feed exceeds the 2 MB response limit"));
            response.destroy();
            return;
          }
          chunks.push(bytes);
        });
        response.on("end", () => {
          if (settled) return;
          settled = true;
          const body = Buffer.concat(chunks).toString("utf8");
          try {
            assertFeedDocument(body, response.headers["content-type"]);
            resolve(body);
          } catch (error) {
            reject(error);
          }
        });
        response.on("error", fail);
      },
    );
    request.on("timeout", () => request.destroy(new Error("Feed request timed out")));
    request.on("error", fail);
    request.end();
  });
  const parsed = parseFeed(xml, domain);
  return { parsed: parsed.length, inserted: await storeNewsItems(source.id, feed.topics, parsed) };
}

export async function scrapeConfiguredSources(): Promise<{
  sources: number;
  itemsParsed: number;
  inserted: number;
  failures: { source: string; message: string }[];
}> {
  const pool = getPool();
  await assertNewsSchema();
  const result = await pool.query<ScrapeSource>(
    `SELECT id, name, category, canonical_url, metadata FROM sources WHERE is_active = true AND category IN ('geopolitical', 'security')`,
  );
  let itemsParsed = 0;
  let inserted = 0;
  let sources = 0;
  const failures: { source: string; message: string }[] = [];
  for (const source of result.rows) {
    const feed = getFeedConfig(source);
    if (!feed) continue;
    sources += 1;
    try {
      const result = await fetchFeed(source, feed);
      itemsParsed += result.parsed;
      inserted += result.inserted;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected feed error";
      failures.push({ source: source.name, message });
      console.error(`News feed sync failed for source "${source.name}":`, error);
    }
  }
  await pruneExpiredNewsItems();
  return { sources, itemsParsed, inserted, failures };
}

export function startNewsScraper(): () => void {
  let stopped = false;
  let running = false;
  let schemaWarningLogged = false;
  const sync = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const summary = await scrapeConfiguredSources();
      schemaWarningLogged = false;
      console.info(
        `News feed sync checked ${summary.sources} sources; parsed ${summary.itemsParsed} entries; inserted ${summary.inserted} new items; failures ${summary.failures.length}`,
      );
    } catch (error) {
      if (error instanceof NewsSchemaMissingError) {
        if (!schemaWarningLogged)
          console.error(`News scraper is waiting for its database migration. ${error.message}`);
        schemaWarningLogged = true;
      } else {
        console.error("News feed sync could not complete:", error);
      }
    } finally {
      running = false;
    }
  };
  void sync();
  const timer = setInterval(() => void sync(), SCRAPE_INTERVAL_MS);
  timer.unref();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
