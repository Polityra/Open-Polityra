"use client";

import { useEffect, useState } from "react";
import { Plus, BarChart3, Clock, Activity, Loader2 } from "lucide-react";
import { api, type ForecastRow, type IndicatorRow } from "@open-polityra/api-client";
import {
  PageHeader,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  InfoNote,
  Badge,
  panel,
  sectionTitle,
  btnPrimary,
  inputClass,
  pick,
  pickTotal,
  fmtDate,
} from "@/components/dashboard/kit";

export default function ForecastingClient() {
  const [forecasts, setForecasts] = useState<ForecastRow[]>([]);
  const [total, setTotal] = useState(0);
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState("");
  const [indicatorId, setIndicatorId] = useState("");
  const [observations, setObservations] = useState("");
  const [horizon, setHorizon] = useState(30);
  const [running, setRunning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [forecastResult, indicatorResult] = await Promise.all([
          api.forecasts.list({ limit: 50 }),
          api.indicators.list({ limit: 100 }),
        ]);
        if (cancelled) return;
        const forecastRows = pick<ForecastRow>(forecastResult, "forecasts");
        setForecasts(forecastRows);
        setTotal(pickTotal(forecastResult, forecastRows.length));
        setIndicators(pick<IndicatorRow>(indicatorResult, "indicators"));
        setError(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setForecasts([]);
          setIndicators([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function createForecast(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setFormError(null);
    try {
      const values = observations
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map(Number);
      if (values.length < 2 || values.some((value) => !Number.isFinite(value))) {
        throw new Error("Enter at least two finite numbers separated by commas or spaces.");
      }
      const selectedIndicator = indicators.find((indicator) => indicator.id === indicatorId);
      if (!selectedIndicator) throw new Error("Choose an indicator from the database registry.");
      await api.forecasts.create({
        target: target.trim() || selectedIndicator.name,
        observations: values,
        horizon,
        indicatorIds: [selectedIndicator.id],
      });
      setShowForm(false);
      setObservations("");
      setRefreshKey((key) => key + 1);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "The forecast could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Strategic"
        accent="Forecasting"
        description="Quantitative projections with uncertainty intervals across monitored domains."
        action={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className={btnPrimary}
          >
            <Plus className="h-4 w-4" /> {showForm ? "Close form" : "New forecast"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={createForecast} className={`${panel} space-y-4 p-6`}>
          <h2 className="font-display text-lg font-semibold text-neutral-950">
            Forecast registered indicator
          </h2>
          <p className="text-sm text-neutral-600">
            Supply observed historical values for an indicator in the database. The worker does not
            generate or substitute missing observations.
          </p>
          {indicators.length === 0 ? (
            <ErrorNote>Add an indicator in Economic Analysis before creating a forecast.</ErrorNote>
          ) : (
            <label className="block text-sm font-medium text-neutral-700">
              Database indicator
              <select
                required
                value={indicatorId}
                onChange={(event) => {
                  const id = event.target.value;
                  setIndicatorId(id);
                  const selected = indicators.find((indicator) => indicator.id === id);
                  if (selected && !target) setTarget(selected.name);
                }}
                className={`${inputClass} mt-1.5`}
              >
                <option value="">Select an indicator</option>
                {indicators.map((indicator) => (
                  <option key={indicator.id} value={indicator.id}>
                    {indicator.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium text-neutral-700">
            Forecast target (optional)
            <input
              maxLength={512}
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Defaults to the selected indicator"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Historical observed values
            <textarea
              required
              rows={3}
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
              className={`${inputClass} mt-1.5 font-mono`}
              placeholder="12.4, 12.8, 13.1, 13.0, 13.6"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Horizon (days)
            <input
              type="number"
              min={1}
              max={3650}
              value={horizon}
              onChange={(event) => setHorizon(Number(event.target.value))}
              className={`${inputClass} mt-1.5 max-w-40`}
            />
          </label>
          {formError && <ErrorNote>{formError}</ErrorNote>}
          <button type="submit" className={btnPrimary} disabled={running || indicators.length === 0}>
            {running && <Loader2 className="h-4 w-4 animate-spin" />}
            {running ? "Forecasting…" : "Run forecast with olmo-3:7b"}
          </button>
        </form>
      )}

      <div className={panel}>
        <div className="border-b border-black/10 px-6 py-4">
          <h2 className={sectionTitle}>Stored forecasts ({total})</h2>
        </div>
        {loading ? (
          <LoadingBlock label="Loading forecasts…" />
        ) : error ? (
          <div className="p-6">
            <ErrorNote>Failed to load forecasts from the backend.</ErrorNote>
          </div>
        ) : forecasts.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No forecasts yet"
            text="Forecasts produced by analyses will appear here with their method and confidence interval."
          />
        ) : (
          <ul className="divide-y divide-black/[0.08]">
            {forecasts.map((f) => {
              const lo = f.confidence_lower,
                hi = f.confidence_upper;
              const trend =
                f.values && typeof f.values.trend_direction === "string"
                  ? f.values.trend_direction
                  : "not recorded";
              const points = Array.isArray(f.values?.projected_values)
                ? f.values.projected_values
                    .slice(0, 5)
                    .map((point) =>
                      typeof point === "object" &&
                      point !== null &&
                      "point_estimate" in point &&
                      typeof point.point_estimate === "number"
                        ? point.point_estimate.toFixed(2)
                        : null,
                    )
                    .filter((point): point is string => point !== null)
                : [];
              return (
                <li key={f.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-950">{f.target}</p>
                      <p className="mt-0.5 font-mono text-xs text-neutral-500">
                        Analysis {f.analysis_id?.slice(0, 8)}
                      </p>
                    </div>
                    <Badge tone="neutral">Modelled interval</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-neutral-600">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5 text-neutral-500" />
                      {f.method}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" />
                      {fmtDate(f.created_at)}
                    </span>
                    <span className="font-mono">
                      Range [{lo?.toFixed(2) ?? "?"}, {hi?.toFixed(2) ?? "?"}]
                    </span>
                    <span className="capitalize">Trend: {trend}</span>
                    {points.length > 0 && (
                      <span className="font-mono">First values: {points.join(", ")}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <InfoNote>
        Forecasts use a simple moving average over the observed series. They do not model causal
        effects and should be reviewed by a domain expert before use.
      </InfoNote>

      <InfoNote tone="warning">
        <span className="font-semibold">Disclaimer:</span> Forecasts are probabilistic projections,
        not predictions. Confidence intervals reflect statistical uncertainty. All forecasts require
        human expert review before use in decision-making.
      </InfoNote>
    </div>
  );
}
