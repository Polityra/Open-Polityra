/**
 * Standardized API response envelope used across all Open Polityra services.
 */

import { z } from 'zod'

export const ApiErrorSchema = z.object({
  code: z.string().describe('Machine-readable error code (e.g., "validation_error", "not_found").'),
  message: z.string().describe('Human-readable error description.'),
  details: z.array(z.unknown()).optional().describe('Additional context for the error.'),
})

export const ApiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    ok: z.literal(true),
    data,
    meta: z.object({
      requestId: z.string().uuid().optional(),
      timestamp: z.string().datetime().optional(),
    }).optional(),
  })

export const ApiListSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    ok: z.literal(true),
    data: z.array(data),
    meta: z.object({
      total: z.number(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
    }),
  })

export type ApiError = z.infer<typeof ApiErrorSchema>
export type ApiSuccess<T> = { ok: true; data: T; meta?: { requestId?: string; timestamp?: string } }
export type ApiList<T> = { ok: true; data: T[]; meta: { total: number; page?: number; pageSize?: number } }
