import { z } from "zod";

export const createReportSchema = z.object({
  title: z.string().trim().min(2).max(512),
  content: z.record(z.string(), z.unknown()).default({}),
});
