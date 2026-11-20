"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Clock, Search } from "lucide-react";
import { api, type AnalysisRow } from "@open-polityra/api-client";
import {
  Badge,
  EmptyState,
  ErrorNote,
  LoadingBlock,
  PageHeader,
  StatCard,
  btnGhost,
  chip,
  inputClass,
  panel,
  sectionTitle,
  timeAgo,
} from "@/components/dashboard/kit";

const STATUSES = ["pending", "running", "completed", "failed"] as const;

function labelFor(analysis: AnalysisRow) {
  const topic = analysis.parameters?.topic;
  return typeof topic === "string" && topic.trim() ? topic : analysis.title;
}

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await api.analyses.list({ limit: 200 });
        if (!active) return;
        setAnalyses(result.analyses);
        setError(null);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load analyses.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const visible = useMemo(
    () =>
      analyses.filter(
        (analysis) =>
          (!status || analysis.status === status) &&
          (!search || labelFor(analysis).toLowerCase().includes(search.toLowerCase())),
      ),
    [analyses, search, status],
  );
  const inProgress = analyses.filter((analysis) =>
    ["pending", "running"].includes(analysis.status),
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analysis"
        accent="History"
        description="Every queued, running, completed and failed analysis has a permanent status and detail page."
        action={
          <Link href="/dashboard/geopolitics" className={btnGhost}>
            Start an analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={analyses.length} icon={BarChart3} sub="Recent 200" />
        <StatCard label="In progress" value={inProgress} icon={Clock} sub="Queue plus running" />
        <StatCard
          label="Completed"
          value={analyses.filter((analysis) => analysis.status === "completed").length}
          icon={BarChart3}
          sub="Ready to open"
        />
        <StatCard
          label="Failed"
          value={analyses.filter((analysis) => analysis.status === "failed").length}
          icon={BarChart3}
          sub="Includes saved error detail"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(!status)} onClick={() => setStatus("")}>
            All
          </button>
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              className={`${chip(status === item)} capitalize`}
              onClick={() => setStatus(status === item ? "" : item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions and titles…"
            aria-label="Search analysis history"
          />
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <div className={panel}>
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className={sectionTitle}>Saved analyses</h2>
        </div>
        {loading ? (
          <LoadingBlock label="Loading analysis history…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={analyses.length ? "No analyses match these filters" : "No analyses yet"}
            text={
              analyses.length
                ? "Clear the search or choose another status."
                : "Run an analysis from any domain page. It will continue here after you navigate away."
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-200">
            {visible.map((analysis) => (
              <li key={analysis.id}>
                <Link
                  href={`/dashboard/analyses/${analysis.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-neutral-50"
                >
                  <span className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-950">
                      {labelFor(analysis)}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span>{timeAgo(analysis.updated_at)}</span>
                      <span className="font-mono">{analysis.id.slice(0, 8)}</span>
                      <span className="capitalize">
                        {String(analysis.parameters?.kind ?? "manual analysis").replaceAll(
                          "-",
                          " ",
                        )}
                      </span>
                    </span>
                  </span>
                  <Badge
                    tone={
                      analysis.status === "completed"
                        ? "success"
                        : analysis.status === "failed"
                          ? "danger"
                          : analysis.status === "running"
                            ? "info"
                            : "neutral"
                    }
                  >
                    {analysis.status}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-neutral-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
