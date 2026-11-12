import type { Request, Response } from "express";
import * as sourceService from "./service";
import { createSourceSchema, updateSourceSchema } from "./schema";
import { validateFeedUrl } from "../news/scraper";
import { discoverFeed } from "../news/discovery";
import { z } from "zod";

const discoverFeedSchema = z.object({
  canonicalUrl: z
    .string()
    .url()
    .refine(
      (value) => URL.canParse(value) && new URL(value).protocol === "https:",
      "URL must use HTTPS",
    ),
});

export async function discoverSourceFeed(req: Request, res: Response): Promise<void> {
  const parsed = discoverFeedSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: parsed.error.message },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }
  try {
    const feedUrl = await discoverFeed(parsed.data.canonicalUrl);
    res.json({
      ok: true,
      data: { feedUrl },
      meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: {
        code: "feed_discovery_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
}

export async function listSources(req: Request, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const topic = req.query.topic as string | undefined;
  const limit = parseInt((req.query.limit as string) ?? "50", 10);
  const offset = parseInt((req.query.offset as string) ?? "0", 10);

  const result = await sourceService.listSources(Math.min(limit, 200), offset, category, topic);
  res.json({
    ok: true,
    data: { sources: result.rows, meta: { total: result.total, limit, offset } },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}

export async function createSource(req: Request, res: Response): Promise<void> {
  const parsed = createSourceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: parsed.error.message },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

  if (parsed.data.feedUrl && parsed.data.canonicalUrl) {
    try {
      await validateFeedUrl(parsed.data.feedUrl, new URL(parsed.data.canonicalUrl).hostname);
      parsed.data.feedUrl = await discoverFeed(parsed.data.canonicalUrl, parsed.data.feedUrl);
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: {
          code: "validation_error",
          message: error instanceof Error ? error.message : "Feed URL is not allowed",
        },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }
  }
  const source = await sourceService.createSource(parsed.data);
  res.status(201).json({
    ok: true,
    data: { source },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}

export async function getSource(req: Request<{ id: string }>, res: Response): Promise<void> {
  const source = await sourceService.getSourceById(req.params.id);
  if (!source) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Source not found" },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }
  res.json({
    ok: true,
    data: { source },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}

export async function updateSource(req: Request<{ id: string }>, res: Response): Promise<void> {
  const parsed = updateSourceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: parsed.error.message },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

  const source = await sourceService.updateSource(req.params.id, parsed.data);
  if (!source) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Source not found" },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }
  res.json({
    ok: true,
    data: { source },
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}

export async function deleteSource(req: Request<{ id: string }>, res: Response): Promise<void> {
  const deleted = await sourceService.deleteSource(req.params.id);
  if (!deleted) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Source not found" },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }
  res.json({
    ok: true,
    data: null,
    meta: { requestId: req.id ?? "", timestamp: new Date().toISOString() },
  });
}
