"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, ExternalLink, Loader2, Play, RotateCcw } from "lucide-react";
import { api, type AnalysisRow } from "@open-polityra/api-client";
import AiMarkdown from "@/components/common/AiMarkdown";
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

  useEffect(() => {
    if (!analysis || !["pending", "running"].includes(analysis.status)) return;
    const timer = window.setInterval(() => {
      void api.analyses.status(analysis.id).then(
        ({ analysis: latest }) => {
          setAnalysis(latest);
          if (!["pending", "running"].includes(latest.status)) setRunning(false);
        },
        (cause) => {
          setError(cause instanceof Error ? cause.message : "Could not refresh analysis status.");
        },
      );
    }, 1500);
    return () => window.clearInterval(timer);
  }, [analysis]);

  async function run(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setError(null);
    setAnalysis(null);
    try {
      const { analysis: queued } = await api.analyses.create({
        title: question.trim(),
        topic: question.trim(),
        context: context.trim() || undefined,
        sourceIds,
        indicatorIds,
        reportIds,
        scenarioIds,
      });
      setAnalysis(queued);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The analysis could not be completed.");
      setRunning(false);
    }
  }

  return (
    <section className={`${panel} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-950">Run an analysis</h2>
          <p className="mt-1 text-sm text-neutral-600">
            The request is saved first. You can leave this page while the worker completes it.
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
            {running ? "Queued — tracking progress…" : "Queue analysis"}
          </button>
        </form>
      )}

      {analysis && (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {analysis.status === "pending"
                  ? "Waiting for a worker"
                  : analysis.status === "running"
                    ? "Analysis in progress"
                    : analysis.status === "completed"
                      ? "Analysis completed"
                      : "Analysis failed"}
              </p>
              <p className="mt-0.5 font-mono text-xs text-neutral-500">{analysis.id}</p>
            </div>
            <Link
              href={`/dashboard/analyses/${analysis.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-4"
            >
              Open details
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          {resultText(analysis) ? (
            <InfoNote>
              <span className="font-semibold">Analysis saved:</span>
              <AiMarkdown className="mt-2" text={resultText(analysis) ?? ""} />
            </InfoNote>
          ) : analysis.error_message ? (
            <ErrorNote>{analysis.error_message}</ErrorNote>
          ) : (
            <InfoNote>
              The analysis remains available in history while it runs. This page checks its status
              automatically.
            </InfoNote>
          )}
        </div>
      )}
    </section>
  );
}
