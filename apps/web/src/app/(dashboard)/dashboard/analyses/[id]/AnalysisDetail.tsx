"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Clock, RefreshCw } from "lucide-react";
import { api, type AnalysisRow } from "@open-polityra/api-client";
import AiMarkdown from "@/components/common/AiMarkdown";
import {
  Badge,
  EmptyState,
  ErrorNote,
  InfoNote,
  LoadingBlock,
  PageHeader,
  btnGhost,
  fmtDate,
  panel,
  sectionTitle,
} from "@/components/dashboard/kit";

function valueAt(result: AnalysisRow["result"], key: string) {
  if (!result || typeof result !== "object") return null;
  return result[key];
}

export default function AnalysisDetail({ id }: { id: string }) {
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let terminal = false;
    const load = async () => {
      try {
        const result = await api.analyses.status(id);
        if (!active) return;
        setAnalysis(result.analysis);
        terminal = !["pending", "running"].includes(result.analysis.status);
        setError(null);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load analysis.");
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (!terminal) void load();
    }, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id]);

  if (!analysis && !error) return <LoadingBlock label="Loading analysis…" />;
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!analysis) return <EmptyState icon={BarChart3} title="Analysis not found" />;

  const summary = valueAt(analysis.result, "summary");
  const evidence = valueAt(analysis.result, "evidence");
  const statistics = valueAt(analysis.result, "statistics");
  const uncertainty = valueAt(analysis.result, "uncertainty");

  return (
    <div className="space-y-8">
      <PageHeader
        title={analysis.title || "Analysis"}
        accent="Detail"
        description="Durable status, source context, findings and errors for this saved analysis."
        action={
          <Link href="/dashboard/analyses" className={btnGhost}>
            <ArrowLeft className="h-4 w-4" />
            Back to history
          </Link>
        }
      />

      <div className={`${panel} grid gap-4 p-5 sm:grid-cols-4`}>
        <div>
          <p className={sectionTitle}>Status</p>
          <Badge
            tone={
              analysis.status === "completed"
                ? "success"
                : analysis.status === "failed"
                  ? "danger"
                  : "info"
            }
          >
            {analysis.status}
          </Badge>
        </div>
        <div>
          <p className={sectionTitle}>Created</p>
          <p className="mt-2 text-sm">{fmtDate(analysis.created_at)}</p>
        </div>
        <div>
          <p className={sectionTitle}>Updated</p>
          <p className="mt-2 text-sm">{fmtDate(analysis.updated_at)}</p>
        </div>
        <div>
          <p className={sectionTitle}>Analysis ID</p>
          <p className="mt-2 break-all font-mono text-xs">{analysis.id}</p>
        </div>
      </div>

      {["pending", "running"].includes(analysis.status) && (
        <InfoNote>
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {analysis.status === "pending"
              ? "This analysis is queued. A worker will pick it up shortly."
              : "A worker is processing this analysis. Status refreshes automatically."}
          </span>
        </InfoNote>
      )}
      {analysis.error_message && <ErrorNote>{analysis.error_message}</ErrorNote>}

      <div className={`${panel} p-6`}>
        <h2 className={sectionTitle}>Summary</h2>
        {typeof summary === "string" ? (
          <AiMarkdown className="mt-4" text={summary} />
        ) : analysis.status === "completed" ? (
          <EmptyState
            icon={BarChart3}
            title="No narrative summary was returned"
            text="The complete structured result is shown below."
          />
        ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
            <Clock className="h-4 w-4" />
            Findings will appear here when processing finishes.
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${panel} p-6`}>
          <h2 className={sectionTitle}>Evidence</h2>
          {evidence ? (
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-6 text-neutral-700">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">No structured evidence was returned.</p>
          )}
        </section>
        <section className={`${panel} p-6`}>
          <h2 className={sectionTitle}>Statistics and uncertainty</h2>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-6 text-neutral-700">
            {JSON.stringify({ statistics, uncertainty }, null, 2)}
          </pre>
        </section>
      </div>

      <section className={`${panel} p-6`}>
        <h2 className={sectionTitle}>Request parameters</h2>
        <pre className="mt-4 overflow-auto whitespace-pre-wrap text-xs leading-6 text-neutral-700">
          {JSON.stringify(analysis.parameters ?? {}, null, 2)}
        </pre>
      </section>
    </div>
  );
}
