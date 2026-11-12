"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus, GitBranch, TrendingUp, Zap, ArrowRightLeft, Sprout, Loader2 } from "lucide-react";
import { api, type ScenarioRow } from "@open-polityra/api-client";
import {
  PageHeader,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  InfoNote,
  panel,
  sectionTitle,
  btnPrimary,
  inputClass,
  th,
  pick,
  fmtDate,
} from "@/components/dashboard/kit";
import AnalysisRunner from "@/components/dashboard/AnalysisRunner";

// Reference templates (documentation of scenario archetypes, not database records)
const templates = [
  {
    name: "Baseline",
    icon: TrendingUp,
    description: "Continuation of current trends with minimal disruption",
    parameters: ["trend_continuation", "gradual_change"],
  },
  {
    name: "High Stress",
    icon: Zap,
    description: "Severe shock events across multiple domains simultaneously",
    parameters: ["systemic_shock", "multi_domain_failure"],
  },
  {
    name: "Transition",
    icon: ArrowRightLeft,
    description: "Gradual structural shift with moderate disruption",
    parameters: ["structural_shift", "managed_transition"],
  },
  {
    name: "Optimistic Growth",
    icon: Sprout,
    description: "Favorable conditions with positive developments across indicators",
    parameters: ["favorable_conditions", "innovation_boost"],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function ScenariosClient() {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [parameters, setParameters] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.scenarios.list({ limit: 50 });
        if (!cancelled) setScenarios(pick<ScenarioRow>(res, "scenarios"));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function applyTemplate(template: (typeof templates)[number]) {
    setName(template.name);
    setDescription(template.description);
    setAssumptions("");
    setParameters(JSON.stringify({ archetype: template.name, tags: template.parameters }, null, 2));
    setShowForm(true);
    setFormError(null);
  }

  async function createScenario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const parsedParameters: unknown = JSON.parse(parameters);
      if (!isRecord(parsedParameters)) {
        throw new Error("Parameters must be a JSON object.");
      }
      await api.scenarios.create({
        name: name.trim(),
        description: description.trim() || undefined,
        assumptions: assumptions.trim() ? { narrative: assumptions.trim() } : {},
        parameters: parsedParameters,
      });
      setShowForm(false);
      setRefreshKey((key) => key + 1);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not save this scenario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scenario"
        accent="Modeling"
        description="Construct, compare, and track scenario pathways with editable assumptions. Non-predictive analysis tool."
        action={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className={btnPrimary}
          >
            <Plus className="h-4 w-4" /> {showForm ? "Close form" : "New scenario"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={createScenario} className={`${panel} space-y-4 p-6`}>
          <h2 className="font-display text-lg font-semibold text-neutral-950">
            Save a scenario pathway
          </h2>
          <label className="block text-sm font-medium text-neutral-700">
            Name
            <input
              required
              minLength={2}
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Description
            <input
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Assumptions
            <textarea
              rows={3}
              maxLength={6000}
              value={assumptions}
              onChange={(event) => setAssumptions(event.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="State the assumptions and uncertainty behind this pathway."
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Parameters (JSON object)
            <textarea
              required
              rows={5}
              value={parameters}
              onChange={(event) => setParameters(event.target.value)}
              className={`${inputClass} mt-1.5 font-mono`}
            />
          </label>
          {formError && <ErrorNote>{formError}</ErrorNote>}
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save scenario"}
          </button>
        </form>
      )}

      <InfoNote>
        <span className="font-semibold">Note:</span> Scenario modeling produces non-predictive
        analyses for strategic planning purposes only. Results require human review and domain
        expertise interpretation.
      </InfoNote>

      <div className={panel}>
        <div className="border-b border-black/10 px-6 py-4">
          <h2 className={sectionTitle}>Saved scenarios</h2>
        </div>
        {loading ? (
          <LoadingBlock label="Loading scenarios…" />
        ) : error ? (
          <div className="p-6">
            <ErrorNote>Failed to load scenarios from the backend.</ErrorNote>
          </div>
        ) : scenarios.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No scenarios yet"
            text="Scenarios saved to the database will appear here. Use the templates below as a starting point."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {["Scenario", "Assumptions", "Parameters", "Created"].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.08]">
                {scenarios.map((s) => (
                  <Fragment key={s.id}>
                    <tr className="transition-colors hover:bg-black/[0.03]">
                      <td className="px-6 py-3.5 font-medium text-neutral-950">
                        <button
                          type="button"
                          aria-expanded={expanded === s.id}
                          onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                          className="text-left hover:underline"
                        >
                          {s.name}
                        </button>
                      </td>
                      <td className="max-w-xs truncate px-6 py-3.5 text-neutral-600">
                        {s.description || "—"}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-neutral-600">
                        {s.parameters ? Object.keys(s.parameters).length : 0} values
                      </td>
                      <td className="px-6 py-3.5 text-neutral-600">{fmtDate(s.created_at)}</td>
                    </tr>
                    {expanded === s.id && (
                      <tr>
                        <td colSpan={4} className="space-y-4 bg-neutral-50 p-5">
                          <pre className="overflow-auto whitespace-pre-wrap text-xs leading-5 text-neutral-600">
                            {JSON.stringify(
                              { assumptions: s.assumptions, parameters: s.parameters },
                              null,
                              2,
                            )}
                          </pre>
                          <AnalysisRunner
                            topic={`Scenario assessment: ${s.name}`}
                            scenarioIds={[s.id]}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className={`${sectionTitle} mb-3`}>Scenario templates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <button
              type="button"
              key={t.name}
              onClick={() => applyTemplate(t)}
              className={`${panel} p-5 text-left transition-colors hover:border-black/40`}
            >
              <span className="inline-flex rounded-lg border border-black/10 bg-neutral-100 p-2.5 text-neutral-900">
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-neutral-950">
                {t.name}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{t.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.parameters.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-black/10 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] text-neutral-700"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
