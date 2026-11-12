import { assertFeedDocument, fetchPublicDocument } from "./scraper";

export function feedLinks(html: string, website: string): string[] {
  const links: string[] = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const attributes = new Map<string, string>();
    for (const attr of tag.matchAll(/([a-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      attributes.set(attr[1].toLowerCase(), attr[2] ?? attr[3]);
    }
    if (
      !attributes.get("rel")?.toLowerCase().split(/\s+/).includes("alternate") ||
      !["application/rss+xml", "application/atom+xml"].includes(
        attributes.get("type")?.toLowerCase() ?? "",
      )
    )
      continue;
    const href = attributes.get("href");
    if (!href) continue;
    try {
      links.push(new URL(href.replace(/&amp;/g, "&"), website).href);
    } catch {
      // Invalid advertised URLs are ignored; other candidates are still checked.
    }
  }
  return links;
}

export async function discoverFeed(website: string, preferred?: string): Promise<string> {
  const site = new URL(website);
  const domain = site.hostname.replace(/^www\./, "");
  const candidates = new Set<string>();
  const errors: string[] = [];
  const deadline = Date.now() + 22_000;
  const read = (url: string) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Feed discovery timed out");
    return fetchPublicDocument(url, domain, Math.min(2_500, remaining));
  };
  if (preferred) candidates.add(preferred);
  try {
    const document = await read(site.href);
    try {
      assertFeedDocument(document.body, document.contentType);
      candidates.add(site.href);
    } catch {
      for (const link of feedLinks(document.body, document.finalUrl ?? site.href).slice(0, 3))
        candidates.add(link);
    }
  } catch (error) {
    errors.push(`website: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const path of ["/rss.xml", "/feed", "/feed/", "/rss", "/atom.xml"]) {
    candidates.add(new URL(path, site.origin).href);
  }
  for (const candidate of candidates) {
    try {
      const document = await read(candidate);
      assertFeedDocument(document.body, document.contentType);
      return document.finalUrl ?? candidate;
    } catch (error) {
      errors.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Could not discover a valid same-domain RSS/Atom feed. ${errors.join("; ")}`);
}
