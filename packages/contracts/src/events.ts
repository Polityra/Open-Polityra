/**
 * Domain event definitions used for inter-service communication.
 */

import { z } from "zod";

export const AnalysisTaskCreatedEventSchema = z.object({
  type: z.literal("analysis.task.created"),
  payload: z.object({
    analysisId: z.string().uuid(),
    userId: z.string().uuid(),
    sourceIds: z.array(z.string().uuid()),
    parameters: z.record(z.string(), z.unknown()),
  }),
});

export const AnalysisTaskCompletedEventSchema = z.object({
  type: z.literal("analysis.task.completed"),
  payload: z.object({
    analysisId: z.string().uuid(),
    status: z.enum(["success", "failed", "partial"]),
    resultId: z.string().uuid().optional(),
    error: z.string().optional(),
  }),
});

export const DataSourceUpdatedEventSchema = z.object({
  type: z.literal("datasource.updated"),
  payload: z.object({
    sourceId: z.string().uuid(),
    dataType: z.string(),
    updatedAt: z.string().datetime(),
  }),
});

export const PipelineJobStateChangedEventSchema = z.object({
  type: z.literal("pipeline.job.state_changed"),
  payload: z.object({
    jobId: z.string().uuid(),
    jobType: z.string(),
    status: z.enum(["pending", "running", "completed", "failed", "dead_letter", "cancelled"]),
    attempt: z.number().int().nonnegative(),
    correlationId: z.string().uuid(),
    occurredAt: z.string().datetime(),
    error: z.string().optional(),
  }),
});

export type AnalysisTaskCreated = z.infer<typeof AnalysisTaskCreatedEventSchema>;
export type AnalysisTaskCompleted = z.infer<typeof AnalysisTaskCompletedEventSchema>;
export type DataSourceUpdated = z.infer<typeof DataSourceUpdatedEventSchema>;
export type PipelineJobStateChanged = z.infer<typeof PipelineJobStateChangedEventSchema>;
