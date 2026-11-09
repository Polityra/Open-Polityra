import { SourceRepository } from "../../repositories/source.repository";
import type { SourceRow } from "../../repositories/source.repository";
import { NotFoundError, ValidationError } from "../../errors/appError";
import type { CreateSourceInput, UpdateSourceInput } from "./schema";

let cachedRepo: SourceRepository | null = null;

function _getRepo(): SourceRepository {
  if (cachedRepo) return cachedRepo;
  cachedRepo = new SourceRepository();
  return cachedRepo;
}

export async function createSource(params: CreateSourceInput): Promise<SourceRow> {
  const repo = _getRepo();
  const existing = await repo.findAll(200, 0);
  const dupes = existing.rows.filter((r) => r.name.toLowerCase() === params.name.toLowerCase());
  if (dupes.length > 0) throw new ValidationError(`Source "${params.name}" already exists`);

  return repo.create({
    name: params.name,
    publisher: params.publisher,
    license: params.license,
    dataType: params.dataType,
    category: params.category,
    canonicalUrl: params.canonicalUrl,
    metadata: {
      ...params.metadata,
      ...(params.feedUrl && params.topics
        ? {
            news_scraper: { enabled: true, feedUrl: params.feedUrl, topics: params.topics },
          }
        : {}),
    },
  });
}

export async function listSources(limit = 50, offset = 0, category?: string, topic?: string) {
  const repo = _getRepo();
  return repo.findAll(limit, offset, category, topic);
}

export async function getSourceById(id: string): Promise<SourceRow | null> {
  const repo = _getRepo();
  const source = await repo.findById(id);
  if (!source) throw new NotFoundError("Source");
  return source;
}

export async function updateSource(
  id: string,
  updates: UpdateSourceInput,
): Promise<SourceRow | null> {
  const repo = _getRepo();
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Source");

  const mapped: Partial<
    Pick<SourceRow, "name" | "publisher" | "license" | "canonical_url" | "metadata">
  > = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.publisher !== undefined) mapped.publisher = updates.publisher;
  if (updates.license !== undefined) mapped.license = updates.license;
  if (updates.canonicalUrl !== undefined) mapped.canonical_url = updates.canonicalUrl;
  if (updates.metadata !== undefined) mapped.metadata = updates.metadata;

  return repo.update(id, mapped);
}

export async function deleteSource(id: string): Promise<boolean> {
  const repo = _getRepo();
  const exists = await repo.findById(id);
  if (!exists) throw new NotFoundError("Source");
  return repo.delete(id);
}
