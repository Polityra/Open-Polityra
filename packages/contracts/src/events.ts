/**
 * Domain event definitions used for inter-service communication.
 */

import { z } from 'zod'

export const AnalysisTaskCreatedEventSchema = z.object({
  type: z.literal('analysis.task.created'),
  payload: z.object({
    analysisId: z.string().uuid(),
    userId: z.string().uuid(),
    sourceIds: z.array(z.string().uuid()),
    parameters: z.record(z.string(), z.unknown()),
  }),
})

export const AnalysisTaskCompletedEventSchema = z.object({
  type: z.literal('analysis.task.completed'),
  payload: z.object({
    analysisId: z.string().uuid(),
    status: z.enum(['success', 'failed', 'partial']),
    resultId: z.string().uuid().optional(),
    error: z.string().optional(),
  }),
})

export const DataSourceUpdatedEventSchema = z.object({
  type: z.literal('datasource.updated'),
  payload: z.object({
    sourceId: z.string().uuid(),
    dataType: z.string(),
    updatedAt: z.string().datetime(),
  }),
})

export type AnalysisTaskCreated = z.infer<typeof AnalysisTaskCreatedEventSchema>
export type AnalysisTaskCompleted = z.infer<typeof AnalysisTaskCompletedEventSchema>
export type DataSourceUpdated = z.infer<typeof DataSourceUpdatedEventSchema>
