"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import {
  api,
  type FiscalAnalysis,
  type FiscalDataset,
  type FiscalObservation,
} from "@open-polityra/api-client";
import { ErrorNote, InfoNote, panel, sectionTitle } from "@/components/dashboard/kit";

const initialScenario = {
  projectionYears: 5,
  stressAnnualBalanceChange: -0.5,
  stressNominalGdpGrowth: 1,
  stressEffectiveInterest: 5,
};

const scenarioColors: Record<string, string> = {
  baseline: "#737373",
  stress: "#dc2626",
  improvement: "#16a34a",
};

function makeChartRows(
  history: FiscalObservation[],
  analysis: FiscalAnalysis,
  field: "debt_pct_gdp" | "balance_pct_gdp",
) {
  const rows = new Map<number, Record<string, number | string | null>>();
  for (const point of history) {
    rows.set(point.year, { year: point.year, Observed: point[field] });
  }
  for (const scenario of analysis.projection.scenarios) {
    const startingPoint = rows.get(analysis.latest.year);
    if (startingPoint) startingPoint[scenario.id] = analysis.latest[field];
    for (const point of scenario.values) {
      const row = rows.get(point.year) ?? { year: point.year };
      row[scenario.id] = point[field];
      rows.set(point.year, row);
    }
  }
  return [...rows.values()];
}

export default function FiscalBalanceExplorer() {
  const [dataset, setDataset] = useState<FiscalDataset | null>(null);
  const [analysis, setAnalysis] = useState<FiscalAnalysis | null>(null);
  const [scenario, setScenario] = useState(initialScenario);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis(parameters = scenario) {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await api.fiscalBalance.analyze(parameters);
      setAnalysis(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not calculate the scenarios.");
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [result, analysisResult] = await Promise.all([
          api.fiscalBalance.data(),
          api.fiscalBalance.analyze(initialScenario),
        ]);
        if (cancelled) return;
        setDataset(result);
        setAnalysis(analysisResult);
      } catch (cause) {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Could not load the fiscal dataset.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const debtRows = useMemo(
    () => (dataset && analysis ? makeChartRows(analysis.history, analysis, "debt_pct_gdp") : []),
    [dataset, analysis],
  );
  const balanceRows = useMemo(
    () => (dataset && analysis ? makeChartRows(analysis.history, analysis, "balance_pct_gdp") : []),
    [dataset, analysis],
  );
  const last = dataset?.observations.at(-1);

  return (
    <section className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Research prototype · Phase 1–2
        </p>
        <h2 className={sectionTitle}>Finland fiscal balance and debt</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
          How have Finland’s general-government deficit/surplus and gross debt changed, and how do
          transparent assumptions alter illustrative debt paths?
        </p>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {loading && (
        <div className={`${panel} p-6 text-sm text-neutral-600`}>
          Loading Eurostat observations…
        </div>
      )}

      {dataset && last && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`${panel} p-5`}>
              <p className="text-sm text-neutral-600">Latest observed balance · {last.year}</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-950">
                {last.balance_pct_gdp.toFixed(1)}% of GDP
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Negative values indicate net borrowing (a deficit).
              </p>
            </div>
            <div className={`${panel} p-5`}>
              <p className="text-sm text-neutral-600">Latest observed gross debt · {last.year}</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-950">
                {last.debt_pct_gdp.toFixed(1)}% of GDP
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                General-government consolidated gross debt.
              </p>
            </div>
          </div>

          <form
            className={`${panel} grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5`}
            onSubmit={(event) => {
              event.preventDefault();
              void runAnalysis();
            }}
          >
            <label className="text-xs text-neutral-600">
              Projection horizon (years)
              <input
                aria-label="Projection horizon (years)"
                className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-neutral-950"
                type="number"
                min={1}
                max={10}
                value={scenario.projectionYears}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    projectionYears: event.currentTarget.valueAsNumber,
                  }))
                }
              />
            </label>
            <label className="text-xs text-neutral-600">
              Stress balance change (pp/year)
              <input
                aria-label="Stress balance change (pp/year)"
                className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-neutral-950"
                type="number"
                step="0.1"
                min={-10}
                max={10}
                value={scenario.stressAnnualBalanceChange}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    stressAnnualBalanceChange: event.currentTarget.valueAsNumber,
                  }))
                }
              />
            </label>
            <label className="text-xs text-neutral-600">
              Stress nominal GDP growth (%)
              <input
                aria-label="Stress nominal GDP growth (%)"
                className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-neutral-950"
                type="number"
                step="0.1"
                min={-5}
                max={15}
                value={scenario.stressNominalGdpGrowth}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    stressNominalGdpGrowth: event.currentTarget.valueAsNumber,
                  }))
                }
              />
            </label>
            <label className="text-xs text-neutral-600">
              Stress effective interest (%)
              <input
                aria-label="Stress effective interest (%)"
                className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-neutral-950"
                type="number"
                step="0.1"
                min={-5}
                max={20}
                value={scenario.stressEffectiveInterest}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    stressEffectiveInterest: event.currentTarget.valueAsNumber,
                  }))
                }
              />
            </label>
            <button
              disabled={
                analyzing ||
                !Number.isFinite(scenario.projectionYears) ||
                !Number.isFinite(scenario.stressAnnualBalanceChange) ||
                !Number.isFinite(scenario.stressNominalGdpGrowth) ||
                !Number.isFinite(scenario.stressEffectiveInterest)
              }
              className="inline-flex items-center justify-center gap-2 self-end rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
              {analyzing ? "Calculating…" : "Compare scenarios"}
            </button>
          </form>

          {analysis && (
            <div className="grid gap-5 lg:grid-cols-2">
              {[
                { title: "Gross debt (% of GDP)", rows: debtRows, field: "debt_pct_gdp" as const },
                {
                  title: "Net lending / borrowing (% of GDP)",
                  rows: balanceRows,
                  field: "balance_pct_gdp" as const,
                },
              ].map((chart) => (
                <div className={`${panel} p-5`} key={chart.field}>
                  <h3 className="mb-4 text-sm font-semibold text-neutral-950">{chart.title}</h3>
                  <div
                    className="h-72"
                    role="img"
                    aria-label={`${chart.title} historical data and illustrative scenarios`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chart.rows}
                        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
                      >
                        <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />
                        <XAxis dataKey="year" stroke="#737373" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#737373" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e5e5e5",
                            color: "#0a0a0a",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Observed"
                          name="Observed"
                          stroke="#171717"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                        {analysis.projection.scenarios.map((item) => (
                          <Line
                            key={item.id}
                            type="monotone"
                            dataKey={item.id}
                            name={item.name}
                            stroke={scenarioColors[item.id]}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`${panel} overflow-x-auto`}>
            <div className="border-b border-black/10 px-5 py-4">
              <h3 className="text-sm font-semibold text-neutral-950">Source and method</h3>
            </div>
            <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-6">
              <div>
                <dt className="text-xs text-neutral-500">Source</dt>
                <dd className="mt-1 text-neutral-950">
                  <a
                    className="inline-flex items-center gap-1 text-neutral-950 hover:underline"
                    href={dataset.source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Eurostat · {dataset.source.dataset_id}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Coverage</dt>
                <dd className="mt-1 text-neutral-950">
                  {dataset.observations[0].year}–{last.year} · Annual
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Retrieved</dt>
                <dd className="mt-1 text-neutral-950">{dataset.source.retrieved_at}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Source updated</dt>
                <dd className="mt-1 text-neutral-950">
                  {dataset.source.last_updated.slice(0, 10)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Unit</dt>
                <dd className="mt-1 text-neutral-950">{dataset.source.unit}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Reuse</dt>
                <dd className="mt-1 text-neutral-950">
                  <a
                    className="text-neutral-950 hover:underline"
                    href={dataset.source.license_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Eurostat terms
                  </a>
                </dd>
              </div>
            </dl>
            {analysis && (
              <div className="border-t border-black/10 px-5 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Scenario assumptions
                </h4>
                <ul className="space-y-2 text-xs leading-5 text-neutral-600">
                  {analysis.projection.scenarios.map((item) => (
                    <li key={item.id}>
                      <strong className="text-neutral-950">{item.name}:</strong> {item.description}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-5 text-neutral-600">
                  Debt-ratio formula: {analysis.projection.method}. The calculations omit stock-flow
                  adjustments and other national-accounting effects; scenarios are illustrative, not
                  forecasts.
                </p>
              </div>
            )}
            <div className="border-t border-black/10 px-5 py-4">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-neutral-600">
                <AlertTriangle className="h-4 w-4" />
                Limitations
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-neutral-600">
                {dataset.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          </div>
          <InfoNote>
            Observed statistics are historical Eurostat data. Baseline, stress, and improvement
            lines are deterministic scenario calculations, not predictions or policy
            recommendations. Data can be revised by Eurostat.
          </InfoNote>
        </>
      )}
    </section>
  );
}
