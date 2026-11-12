"use client";

import { useState } from "react";
import { BarChart3, Loader2, Play, RotateCcw } from "lucide-react";
import { api, type AnalysisRow } from "@open-polityra/api-client";
import { ErrorNote, InfoNote, inputClass, panel, btnPrimary } from "./kit";

function resultText(analysis: AnalysisRow): string | null {
  const summary = analysis.result?.summary;
  return typeof summary === "string" ? summary : null;
}

export default function AnalysisRunner({
  topic,
  sourceIds = [],
  indicatorIds = [],
  reportIds = [],
  scenarioIds = [],
}: {
  topic: string;
  sourceIds?: string[];
  indicatorIds?: string[];
  reportIds?: string[];
  scenarioIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(topic);
  const [context, setContext] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(null);

  async function run(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setError(null);
    setAnalysis(null);
    try {
      const { analysis: completed } = await api.analyses.create({
        title: question.trim(),
        topic: question.trim(),
        context: context.trim() || undefined,
        sourceIds,
        indicatorIds,
        reportIds,
        scenarioIds,
      });
      setAnalysis(completed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The analysis could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className={`${panel} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-950">Run an analysis</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Uses matching database records and the configured local Ollama model.
          </p>
        </div>
        <button type="button" className={btnPrimary} onClick={() => setOpen((value) => !value)}>
          {open ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {open ? "Close" : "Start analysis"}
        </button>
      </div>

      {open && (
        <form onSubmit={run} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            Research question
            <input
              required
              minLength={2}
              maxLength={512}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Additional context
            <textarea
              maxLength={6000}
              rows={3}
              value={context}
              onChange={(event) => setContext(event.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Optional notes to accompany the selected records."
            />
          </label>
          <p className="text-xs text-neutral-500">
            Selected database records: {sourceIds.length} sources, {indicatorIds.length} indicators,
            {` ${reportIds.length} reports, ${scenarioIds.length} scenarios.`}
          </p>
          {error && <ErrorNote>{error}</ErrorNote>}
          <button type="submit" className={btnPrimary} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            {running ? "Analyzing…" : "Run with olmo-3:7b"}
          </button>
        </form>
      )}

      {analysis && (
        <div className="mt-5">
          {resultText(analysis) ? (
            <InfoNote>
              <span className="font-semibold">Analysis saved:</span> {resultText(analysis)}
            </InfoNote>
          ) : (
            <ErrorNote>
              Analysis {analysis.id} was saved with status {analysis.status}; no summary was
              returned.
            </ErrorNote>
          )}
        </div>
      )}
    </section>
  );
}
