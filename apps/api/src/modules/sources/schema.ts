import { z } from 'zod';

export const createSourceSchema = z.object({
  name: z.string().min(1).max(255),
  publisher: z.string().max(255).optional(),
  license: z.string().max(128).optional(),
  dataType: z.enum(['dataset', 'indicator', 'report', 'api', 'raw_data']),
  category: z.enum(['economic', 'geopolitical', 'security', 'resilience', 'social', 'environmental', 'infrastructure']),
  canonicalUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceSchema = createSourceSchema.partial().strict();

export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
