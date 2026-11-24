import { z } from "zod";

export const createScenarioSchema = z.object({
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(2000).optional(),
  assumptions: z.record(z.string(), z.unknown()).default({}),
  parameters: z.record(z.string(), z.unknown()).default({}),
});
