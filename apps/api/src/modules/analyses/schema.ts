import { z } from "zod";

export const runAnalysisSchema = z
  .object({
    title: z.string().trim().min(2).max(512).optional(),
    topic: z.string().trim().min(2).max(512),
    context: z.string().trim().max(6000).optional(),
    sourceIds: z.array(z.string().uuid()).max(40).default([]),
    indicatorIds: z.array(z.string().uuid()).max(40).default([]),
    reportIds: z.array(z.string().uuid()).max(40).default([]),
    scenarioIds: z.array(z.string().uuid()).max(40).default([]),
    observations: z.array(z.number().finite()).min(2).max(10_000).optional(),
    scope: z
      .enum(["global", "regional", "national", "subnational", "organization", "topic"])
      .default("topic"),
    time_horizon: z.number().int().min(1).max(3650).default(30),
    methodology: z
      .enum(["descriptive", "timeseries", "forecasting", "simulation", "comprehensive"])
      .default("comprehensive"),
    enable_ai_synthesis: z.boolean().default(true),
  })
  .refine(
    (input) =>
      Boolean(input.context?.trim()) ||
      input.sourceIds.length > 0 ||
      input.indicatorIds.length > 0 ||
      input.reportIds.length > 0 ||
      input.scenarioIds.length > 0 ||
      Boolean(input.observations?.length),
    {
      message: "Select database records or provide context or observations.",
      path: ["context"],
    },
  );

export type RunAnalysisInput = z.infer<typeof runAnalysisSchema>;
