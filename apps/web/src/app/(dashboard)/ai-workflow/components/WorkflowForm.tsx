"use client";

import { useState, useEffect } from "react";
import { api, type AiWorkflowType } from "@open-polityra/api-client";
import { Sparkles, Loader2, AlertCircle, Check } from "lucide-react";
import { WORKFLOW_TYPES, inputClass, labelClass, panelClass } from "./workflow-config";

interface WorkflowFormProps {
  onSubmit: (result: { workflowId: string }) => void;
}

type FormType = Extract<AiWorkflowType, "fiscal-explanation" | "source-summary">;

const num = (v: string, fallback: number) =>
  v.trim() === "" || Number.isNaN(Number(v)) ? fallback : Number(v);

export default function WorkflowForm({ onSubmit }: WorkflowFormProps) {
  const [type, setType] = useState<FormType>("fiscal-explanation");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [years, setYears] = useState("5");
  const [balance, setBalance] = useState("-0.5");
  const [growth, setGrowth] = useState("1");
  const [interest, setInterest] = useState("5");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollama, setOllama] = useState<"checking" | "ok" | "unavailable">("checking");

  useEffect(() => {
    api.aiHealth().then(
      (res) => setOllama(res.available ? "ok" : "unavailable"),
      () => setOllama("unavailable"),
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsRunning(true);
    try {
      const q = question.trim() || undefined;
      const parameters =
        type === "fiscal-explanation"
          ? {
              question: q,
              scenario: {
                projectionYears: Math.round(num(years, 5)),
                stressAnnualBalanceChange: num(balance, -0.5),
                stressNominalGdpGrowth: num(growth, 1),
                stressEffectiveInterest: num(interest, 5),
              },
            }
          : {
              sourceTitle: sourceTitle.trim(),
              sourceUrl: sourceUrl.trim() || undefined,
              text,
              question: q,
            };
      const res = await api.aiWorkflows.create({ type, title: title.trim(), parameters });
      onSubmit({ workflowId: res.result.workflowId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The analysis could not be run.");
    } finally {
      setIsRunning(false);
    }
  }

  const canSubmit =
    ollama === "ok" &&
    title.trim().length > 0 &&
    (type === "fiscal-explanation" || (sourceTitle.trim().length > 0 && text.trim().length >= 40));

  return (
    <form onSubmit={handleSubmit} className={`${panelClass} space-y-6 p-6`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {WORKFLOW_TYPES.map((t) => {
          const active = type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value as FormType)}
              aria-pressed={active}
              className={`rounded-lg border p-4 text-left transition ${
                active
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-black/10 bg-white hover:border-black/40"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <t.icon className="h-4 w-4" /> {t.label}
                {active && <Check className="ml-auto h-4 w-4" />}
              </span>
              <span
                className={`mt-1 block text-xs ${active ? "text-neutral-300" : "text-neutral-600"}`}
              >
                {t.description}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="wf-title" className={labelClass}>
          Title
        </label>
        <input
          id="wf-title"
          className={inputClass}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Finland deficit trend"
        />
      </div>

      <div>
        <label htmlFor="wf-question" className={labelClass}>
          Question (optional)
        </label>
        <input
          id="wf-question"
          className={inputClass}
          value={question}
          maxLength={500}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What does the evidence show about…?"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Asks for an explanation of the evidence only. Recommendations and forecasts are not
          produced.
        </p>
      </div>

      {type === "fiscal-explanation" ? (
        <fieldset className="space-y-3 rounded-lg border border-black/10 bg-neutral-50 p-4">
          <legend className="px-1 text-sm font-medium text-neutral-700">
            Illustrative scenario (calculated in code, not by the model)
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Years (1–10)", years, setYears, "wf-years"],
              ["Annual balance change (pp of GDP)", balance, setBalance, "wf-balance"],
              ["Nominal GDP growth (%)", growth, setGrowth, "wf-growth"],
              ["Effective interest rate (%)", interest, setInterest, "wf-interest"],
            ].map(([label, value, set, id]) => (
              <div key={id as string}>
                <label htmlFor={id as string} className={labelClass}>
                  {label as string}
                </label>
                <input
                  id={id as string}
                  type="number"
                  step="any"
                  className={inputClass}
                  value={value as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wf-src-title" className={labelClass}>
                Source title
              </label>
              <input
                id="wf-src-title"
                className={inputClass}
                value={sourceTitle}
                maxLength={200}
                onChange={(e) => setSourceTitle(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="wf-src-url" className={labelClass}>
                Source URL (optional)
              </label>
              <input
                id="wf-src-url"
                type="url"
                className={inputClass}
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>
          <div>
            <label htmlFor="wf-text" className={labelClass}>
              Source text (40–20,000 characters)
            </label>
            <textarea
              id="wf-text"
              rows={9}
              className={inputClass}
              value={text}
              maxLength={20000}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mt-1 text-xs text-neutral-500">
              The text is split into numbered passages that the summary must cite.
            </p>
          </div>
        </div>
      )}

      {ollama === "unavailable" && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          The local Ollama model is not reachable. Start Ollama and pull the configured model to run
          analyses.
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || isRunning}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isRunning ? "Running pipeline…" : "Run analysis"}
      </button>
    </form>
  );
}
