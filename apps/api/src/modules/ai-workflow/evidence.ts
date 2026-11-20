import { analyzeFiscalBalance, getFiscalDataset } from "../fiscal-balance/service";
import type { FiscalScenarioInput } from "../fiscal-balance/schema";

export type EvidenceKind = "source-note" | "observation" | "statistic" | "scenario" | "passage";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  label: string;
  text: string;
  source?: {
    publisher: string;
    url?: string;
    license?: string;
    retrieved_at?: string;
  };
}

export interface EvidencePack {
  question: string;
  items: EvidenceItem[];
  statistics: Record<string, unknown>;
  limitations: string[];
}

const pct = (value: number) => `${value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}% of GDP`;

const DEFAULT_FISCAL_QUESTION =
  "How have Finland's general-government deficit/surplus and gross debt changed, and how do transparent assumptions alter illustrative debt paths?";

export async function buildFiscalEvidence(
  scenario: FiscalScenarioInput,
  question?: string,
): Promise<EvidencePack> {
  const dataset = await getFiscalDataset();
  const analysis = await analyzeFiscalBalance(scenario);
  const obs = dataset.observations;
  const latest = obs[obs.length - 1];
  const first = obs[0];
  const src = dataset.source;
  const source = {
    publisher: src.publisher,
    url: src.url,
    license: src.license,
    retrieved_at: src.retrieved_at,
  };

  const extreme = (pick: (o: (typeof obs)[number]) => number, dir: "max" | "min") =>
    obs.reduce((best, o) =>
      (dir === "max" ? pick(o) > pick(best) : pick(o) < pick(best)) ? o : best,
    );
  const debtPeak = extreme((o) => o.debt_pct_gdp, "max");
  const debtLow = extreme((o) => o.debt_pct_gdp, "min");
  const deficitLow = extreme((o) => o.balance_pct_gdp, "min");
  const surplusHigh = extreme((o) => o.balance_pct_gdp, "max");

  const changeSince = (yearsBack: number) => {
    const ref = obs.find((o) => o.year === latest.year - yearsBack);
    if (!ref) return null;
    return {
      years_back: yearsBack,
      from_year: ref.year,
      balance_change_pp: Number((latest.balance_pct_gdp - ref.balance_pct_gdp).toFixed(1)),
      debt_change_pp: Number((latest.debt_pct_gdp - ref.debt_pct_gdp).toFixed(1)),
    };
  };
  const changes = [1, 5, 10].map(changeSince).filter((c) => c !== null);

  const items: EvidenceItem[] = [
    {
      id: "E1",
      kind: "source-note",
      label: "Source record",
      text: `${src.publisher} dataset ${src.dataset_id}, ${src.sector}, geography ${src.geography}, ${src.frequency.toLowerCase()} data in ${src.unit.toLowerCase()}. Indicators: ${dataset.indicators.balance_pct_gdp.code} ${dataset.indicators.balance_pct_gdp.label}; ${dataset.indicators.debt_pct_gdp.code} ${dataset.indicators.debt_pct_gdp.label}. Observations cover ${first.year} to ${latest.year}. Retrieved ${src.retrieved_at}; source last updated ${src.last_updated}.`,
      source,
    },
    {
      id: "E2",
      kind: "observation",
      label: `Latest observation (${latest.year})`,
      text: `In ${latest.year} the general-government balance was ${pct(latest.balance_pct_gdp)} and consolidated gross debt was ${pct(latest.debt_pct_gdp)}. ${dataset.indicators.balance_pct_gdp.interpretation}`,
      source,
    },
    {
      id: "E3",
      kind: "statistic",
      label: "Historical extremes",
      text: `Highest debt ratio: ${pct(debtPeak.debt_pct_gdp)} in ${debtPeak.year}. Lowest debt ratio: ${pct(debtLow.debt_pct_gdp)} in ${debtLow.year}. Weakest balance: ${pct(deficitLow.balance_pct_gdp)} in ${deficitLow.year}. Strongest balance: ${pct(surplusHigh.balance_pct_gdp)} in ${surplusHigh.year}.`,
      source,
    },
    {
      id: "E4",
      kind: "statistic",
      label: "Change since earlier years",
      text: changes
        .map(
          (c) =>
            `Since ${c.from_year}: balance changed ${c.balance_change_pp >= 0 ? "+" : "−"}${Math.abs(c.balance_change_pp).toFixed(1)} percentage points; debt ratio changed ${c.debt_change_pp >= 0 ? "+" : "−"}${Math.abs(c.debt_change_pp).toFixed(1)} percentage points.`,
        )
        .join(" "),
      source,
    },
  ];

  analysis.projection.scenarios.forEach((s, index) => {
    const end = s.values[s.values.length - 1];
    items.push({
      id: `E${5 + index}`,
      kind: "scenario",
      label: `Illustrative scenario: ${s.name}`,
      text: `Illustrative calculation, not a forecast. ${s.description} Assumptions: annual balance change ${s.assumptions.annual_balance_change_pp} percentage points, nominal GDP growth ${s.assumptions.nominal_gdp_growth_percent}%, effective interest rate ${s.assumptions.effective_interest_rate_percent}%. After ${analysis.projection.years} years (${end.year}) the debt ratio is ${pct(end.debt_pct_gdp)} and the balance is ${pct(end.balance_pct_gdp)}.`,
      source: { publisher: "Open Polityra deterministic calculation" },
    });
  });

  items.push({
    id: `E${5 + analysis.projection.scenarios.length}`,
    kind: "source-note",
    label: "Dataset limitations",
    text: dataset.limitations.join(" "),
    source,
  });

  return {
    question: question?.trim() || DEFAULT_FISCAL_QUESTION,
    items,
    statistics: {
      latest,
      extremes: {
        debt_peak: debtPeak,
        debt_low: debtLow,
        weakest_balance: deficitLow,
        strongest_balance: surplusHigh,
      },
      changes,
      projection_method: analysis.projection.method,
      scenarios: analysis.projection.scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        assumptions: s.assumptions,
        end: s.values[s.values.length - 1],
      })),
    },
    limitations: [
      ...dataset.limitations,
      "Scenario paths use a simplified debt-ratio equation and omit stock-flow adjustments.",
    ],
  };
}

const MAX_PASSAGES = 40;
const TARGET_PASSAGE_CHARS = 700;

/** Splits user-supplied text into numbered passages so every claim can cite its origin. */
export function splitIntoPassages(text: string): string[] {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const passages: string[] = [];
  for (const block of blocks) {
    if (block.length <= TARGET_PASSAGE_CHARS) {
      passages.push(block);
      continue;
    }
    const sentences = block.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [block];
    let current = "";
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > TARGET_PASSAGE_CHARS) {
        passages.push(current.trim());
        current = "";
      }
      current += sentence;
    }
    if (current.trim()) passages.push(current.trim());
  }
  return passages.slice(0, MAX_PASSAGES);
}

export function buildSourceEvidence(params: {
  sourceTitle: string;
  sourceUrl?: string;
  text: string;
  question?: string;
}): EvidencePack {
  const passages = splitIntoPassages(params.text);
  const source = { publisher: params.sourceTitle, url: params.sourceUrl };
  const items: EvidenceItem[] = passages.map((text, index) => ({
    id: `P${index + 1}`,
    kind: "passage",
    label: `Passage ${index + 1}`,
    text,
    source,
  }));
  const words = params.text.split(/\s+/).filter(Boolean).length;

  return {
    question: params.question?.trim() || `Summarise what "${params.sourceTitle}" states.`,
    items,
    statistics: {
      source_title: params.sourceTitle,
      passages: passages.length,
      words,
      truncated: passages.length === MAX_PASSAGES,
    },
    limitations: [
      "The summary covers only the text you supplied; it was not checked against the original publication.",
      "Open Polityra has not verified the supplied text or its provenance.",
      ...(passages.length === MAX_PASSAGES
        ? [`Only the first ${MAX_PASSAGES} passages were used.`]
        : []),
    ],
  };
}

export function renderEvidenceForPrompt(pack: EvidencePack): string {
  return pack.items.map((item) => `[${item.id}] ${item.label}: ${item.text}`).join("\n");
}
