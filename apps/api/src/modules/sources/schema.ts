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
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceSchema = sourceObjectSchema.partial().strict();

export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
