import { z } from 'zod';

export const fiscalScenarioInputSchema = z.object({
  projectionYears: z.number().int().min(1).max(10).default(5),
  stressAnnualBalanceChange: z.number().min(-10).max(10).default(-0.5),
  stressNominalGdpGrowth: z.number().min(-5).max(15).default(1),
  stressEffectiveInterest: z.number().min(-5).max(20).default(5),
}).strict();

export type FiscalScenarioInput = z.infer<typeof fiscalScenarioInputSchema>;
