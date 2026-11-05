import { z } from 'zod';

export const newsTopics = ['geopolitics', 'conflict', 'security', 'cybersecurity', 'terrorism', 'sanctions'] as const;
const httpsUrl = z.string().url().refine((value) => new URL(value).protocol === 'https:', 'URL must use HTTPS');

const sourceObjectSchema = z.object({
  name: z.string().min(1).max(255),
  publisher: z.string().max(255).optional(),
  license: z.string().max(128).optional(),
  dataType: z.enum(['dataset', 'indicator', 'report', 'api', 'raw_data']),
  category: z.enum(['economic', 'geopolitical', 'security', 'resilience', 'social', 'environmental', 'infrastructure']),
  canonicalUrl: z.string().url().optional(),
  feedUrl: httpsUrl.optional(),
  topics: z.array(z.enum(newsTopics)).min(1).max(newsTopics.length).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

function validateNewsSource(value: z.infer<typeof sourceObjectSchema>, ctx: z.RefinementCtx): void {
  if ((value.feedUrl && !value.canonicalUrl) || (value.topics && !value.feedUrl)) {
    ctx.addIssue({ code: 'custom', message: 'A feed URL, source website URL, and at least one topic are required together' });
  }
  if (value.feedUrl && value.canonicalUrl) {
    if (new URL(value.canonicalUrl).protocol !== 'https:') {
      ctx.addIssue({ code: 'custom', path: ['canonicalUrl'], message: 'News source websites must use HTTPS' });
    }
    const domain = new URL(value.canonicalUrl).hostname.toLowerCase().replace(/^www\./, '');
    const feedHost = new URL(value.feedUrl).hostname.toLowerCase();
    if (feedHost !== domain && !feedHost.endsWith(`.${domain}`)) {
      ctx.addIssue({ code: 'custom', path: ['feedUrl'], message: 'Feed URL must belong to the source domain or a subdomain' });
    }
    if (!['geopolitical', 'security'].includes(value.category)) {
      ctx.addIssue({ code: 'custom', path: ['category'], message: 'News feeds must use the geopolitical or security category' });
    }
    if (value.dataType !== 'api') {
      ctx.addIssue({ code: 'custom', path: ['dataType'], message: 'RSS/Atom sources must use the API data type' });
    }
  }
}

export const createSourceSchema = sourceObjectSchema.superRefine(validateNewsSource);

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceSchema = sourceObjectSchema.partial().strict();

export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
