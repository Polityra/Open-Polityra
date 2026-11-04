/**
 * Shared data schemas used across Open Polityra services.
 */

import { z } from 'zod'

export const PaginatedResponseSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const TimestampedEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export const SourceMetadataSchema = z.object({
  publisher: z.string(),
  url: z.string().url().optional(),
  license: z.string().optional(),
  retrievalDate: z.string().date().optional(),
  description: z.string().optional(),
})

export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>
export type TimestampedEntity = z.infer<typeof TimestampedEntitySchema>
export type SourceMetadata = z.infer<typeof SourceMetadataSchema>
