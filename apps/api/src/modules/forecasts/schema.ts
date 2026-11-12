import { z } from "zod";

export const createForecastSchema = z.object({
  target: z.string().trim().min(2).max(512),
  observations: z.array(z.number().finite()).min(2).max(10_000),
  horizon: z.number().int().min(1).max(3650).default(30),
  context: z.string().trim().max(6000).optional(),
  sourceIds: z.array(z.string().uuid()).max(40).default([]),
  indicatorIds: z.array(z.string().uuid()).max(40).default([]),
});
