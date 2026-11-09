import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import type { FiscalScenarioInput } from "./schema";

const observationSchema = z
  .object({
    year: z.number().int(),
    balance_pct_gdp: z.number().finite(),
    debt_pct_gdp: z.number().finite().nonnegative(),
  })
  .strict();

const fiscalDatasetSchema = z
  .object({
    dataset: z.literal("finland_general_government_fiscal_balance"),
    title: z.string().min(1),
    source: z
      .object({
        publisher: z.literal("Eurostat"),
        dataset_id: z.literal("gov_10dd_edpt1"),
        url: z.string().url(),
        license: z.string().min(1),
        license_url: z.string().url(),
        geography: z.literal("FI"),
        frequency: z.literal("Annual"),
        unit: z.literal("Percent of GDP"),
        sector: z.literal("General government (S13)"),
        retrieved_at: z.string().date(),
        last_updated: z.string().datetime({ offset: true }),
      })
      .strict(),
    indicators: z
      .object({
        balance_pct_gdp: z
          .object({
            code: z.literal("B9"),
            label: z.string().min(1),
            interpretation: z.string().min(1),
          })
          .strict(),
        debt_pct_gdp: z
          .object({
            code: z.literal("GD"),
            label: z.string().min(1),
          })
          .strict(),
      })
      .strict(),
    observations: z.array(observationSchema).min(2),
    limitations: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type FiscalDataset = z.infer<typeof fiscalDatasetSchema>;

const fixturePath = resolve(__dirname, "../../../../../data/examples/finland_fiscal_balance.json");

export async function getFiscalDataset(): Promise<FiscalDataset> {
  const contents = await readFile(fixturePath, "utf8");
  const parsed = fiscalDatasetSchema.safeParse(JSON.parse(contents));
  if (!parsed.success) {
    throw new Error(`Fiscal data snapshot is invalid: ${parsed.error.message}`);
  }

  const observations = parsed.data.observations;
  for (let index = 1; index < observations.length; index += 1) {
    if (observations[index].year <= observations[index - 1].year) {
      throw new Error("Fiscal data snapshot years must be unique and ascending");
    }
  }
  return parsed.data;
}

type ProjectionPoint = {
  year: number;
  balance_pct_gdp: number;
  debt_pct_gdp: number;
};

type ScenarioDefinition = {
  id: "baseline" | "stress" | "improvement";
  name: string;
  annualBalanceChange: number;
  nominalGdpGrowth: number;
  effectiveInterestRate: number;
  description: string;
};

function projectScenario(
  initialBalance: number,
  initialDebt: number,
  startYear: number,
  years: number,
  scenario: ScenarioDefinition,
): ProjectionPoint[] {
  const debtFactor =
    (1 + scenario.effectiveInterestRate / 100) / (1 + scenario.nominalGdpGrowth / 100);
  let debt = initialDebt;
  const points: ProjectionPoint[] = [];

  for (let step = 1; step <= years; step += 1) {
    const balance = initialBalance + scenario.annualBalanceChange * step;
    debt = debt * debtFactor - balance;
    points.push({
      year: startYear + step,
      balance_pct_gdp: Number(balance.toFixed(2)),
      debt_pct_gdp: Number(debt.toFixed(2)),
    });
  }
  return points;
}

export async function analyzeFiscalBalance(input: FiscalScenarioInput) {
  const dataset = await getFiscalDataset();
  const latest = dataset.observations.at(-1);
  if (!latest) {
    throw new Error("Fiscal data snapshot has no observations");
  }

  const scenarios: ScenarioDefinition[] = [
    {
      id: "baseline",
      name: "Baseline (unchanged balance)",
      annualBalanceChange: 0,
      nominalGdpGrowth: 3,
      effectiveInterestRate: 3,
      description:
        "Keeps the latest observed balance unchanged; assumes 3% nominal GDP growth and a 3% effective interest rate.",
    },
    {
      id: "stress",
      name: "Stress",
      annualBalanceChange: input.stressAnnualBalanceChange,
      nominalGdpGrowth: input.stressNominalGdpGrowth,
      effectiveInterestRate: input.stressEffectiveInterest,
      description:
        "Applies the selected annual balance change, nominal GDP growth, and effective interest-rate assumptions.",
    },
    {
      id: "improvement",
      name: "Gradual improvement",
      annualBalanceChange: 0.5,
      nominalGdpGrowth: 3,
      effectiveInterestRate: 3,
      description:
        "Improves the balance by 0.5 percentage points each year; assumes 3% nominal GDP growth and a 3% effective interest rate.",
    },
  ];

  return {
    research_question:
      "How have Finland’s general-government deficit/surplus and gross debt changed, and how do transparent assumptions alter illustrative debt paths?",
    source: dataset.source,
    indicators: dataset.indicators,
    history: dataset.observations,
    latest,
    projection: {
      years: input.projectionYears,
      method:
        "debt_ratio_next = debt_ratio_current × (1 + effective_interest_rate) / (1 + nominal_gdp_growth) − net_lending_ratio",
      scenarios: scenarios.map((scenario) => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        assumptions: {
          annual_balance_change_pp: scenario.annualBalanceChange,
          nominal_gdp_growth_percent: scenario.nominalGdpGrowth,
          effective_interest_rate_percent: scenario.effectiveInterestRate,
        },
        values: projectScenario(
          latest.balance_pct_gdp,
          latest.debt_pct_gdp,
          latest.year,
          input.projectionYears,
          scenario,
        ),
      })),
    },
    limitations: dataset.limitations,
    is_forecast: false,
  };
}
