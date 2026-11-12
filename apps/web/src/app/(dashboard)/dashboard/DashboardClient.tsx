"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Database,
  BarChart3,
  FileText,
  TrendingUp,
  GitBranch,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { SummaryChart } from "@/components/charts/SummaryChart";
import {
  api,
  type AiWorkflowRow,
  type AnalysisRow,
  type ReportRow,
  type SourceRow,
} from "@open-polityra/api-client";
import {
  PageHeader,
  StatCard,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  Badge,
  panel,
  sectionTitle,
  pick,
  pickTotal,
  timeAgo,
} from "@/components/dashboard/kit";

type Item = {
  id: string;
  kind: "analysis" | "report" | "workflow";
  title: string;
  status: string;
  at: string;
};
type Data = {
  sources: SourceRow[];
  sourcesTotal: number;
  analyses: AnalysisRow[];
  reports: ReportRow[];
  reportsTotal: number;
  indicatorsTotal: number;
  forecasts: number;
  scenarios: number;
  workflows: AiWorkflowRow[];
  workflowsTotal: number;
};

const KIND = {
  analysis: { icon: BarChart3, label: "Analysis" },
  report: { icon: FileText, label: "Report" },
  workflow: { icon: Sparkles, label: "AI workflow" },
} as const;

const count = (values: string[]) => {
  const m = new Map<string, number>();
  values.forEach((value) => {
    const k = value || "unknown";
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return [...m].map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
  }));
};

export default function DashboardClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await Promise.allSettled([
        api.sources.list({ limit: 100 }),
        api.analyses.list(),
        api.reports.list({ limit: 100 }),
        api.indicators.list({ limit: 100 }),
        api.forecasts.list(),
        api.scenarios.list(),
        api.aiWorkflows.list({ limit: 50, offset: 0 }),
      ]);
      if (cancelled) return;
      if (r.every((x) => x.status === "rejected")) {
        setError(true);
        return;
      }
      setError(r.some((x) => x.status === "rejected"));
      const sourceResult = r[0].status === "fulfilled" ? r[0].value : null;
      const analysisResult = r[1].status === "fulfilled" ? r[1].value : null;
      const reportResult = r[2].status === "fulfilled" ? r[2].value : null;
      const indicatorResult = r[3].status === "fulfilled" ? r[3].value : null;
      const forecastResult = r[4].status === "fulfilled" ? r[4].value : null;
      const scenarioResult = r[5].status === "fulfilled" ? r[5].value : null;
      const workflowResult = r[6].status === "fulfilled" ? r[6].value : null;
      const sources = pick<SourceRow>(sourceResult, "sources");
      const reports = pick<ReportRow>(reportResult, "reports");
      const workflows = pick<AiWorkflowRow>(workflowResult, "workflows");
      setData({
        sources,
        sourcesTotal: pickTotal(sourceResult, sources.length),
        analyses: pick<AnalysisRow>(analysisResult, "analyses"),
        reports,
        reportsTotal: pickTotal(reportResult, reports.length),
        indicatorsTotal: pickTotal(
          indicatorResult,
          pick<unknown>(indicatorResult, "indicators").length,
        ),
        forecasts: pickTotal(forecastResult, pick<unknown>(forecastResult, "forecasts").length),
        scenarios: pickTotal(scenarioResult, pick<unknown>(scenarioResult, "scenarios").length),
        workflows,
        workflowsTotal: pickTotal(workflowResult, workflows.length),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => {
      void api.analyses.list().then(
        (result) => {
          if (!cancelled) {
            setData((current) =>
              current ? { ...current, analyses: pick<AnalysisRow>(result, "analyses") } : current,
            );
          }
        },
        () => {
          if (!cancelled) setError(true);
        },
      );
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;
    const running = data.analyses.filter(
      (a) => a.status === "running" || a.status === "pending",
    ).length;
    const published = data.reports.filter((x) => x.status === "published").length;
    const activeSources = data.sources.filter((s) => s.is_active).length;
    const feed: Item[] = [
      ...data.analyses.map((a) => ({
        id: `a${a.id}`,
        kind: "analysis" as const,
        title: `Analysis ${a.status}`,
        status: a.status,
        at: a.updated_at ?? a.created_at,
      })),
      ...data.reports.map((x) => ({
        id: `r${x.id}`,
        kind: "report" as const,
        title: x.title,
        status: x.status,
        at: x.created_at,
      })),
      ...data.workflows.map((w) => ({
        id: `w${w.id}`,
        kind: "workflow" as const,
        title: w.title,
        status: w.status,
        at: w.updated_at ?? w.created_at,
      })),
    ]
      .filter((i) => i.at)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 8);
    return {
      running,
      published,
      activeSources,
      feed,
      analysesByStatus: count(data.analyses.map((analysis) => analysis.status)),
      sourcesByType: count(data.sources.map((source) => source.data_type)),
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Strategic"
        accent="Dashboard"
        description="Live overview of sources, analyses, reports and AI workflows, read directly from the platform database."
      />

      {error && (
        <ErrorNote>
          Some dashboard data could not be loaded. Check the API connection and refresh.
        </ErrorNote>
      )}
      {!data && !error && (
        <div className={panel}>
          <LoadingBlock label="Loading platform data…" />
        </div>
      )}

      {data && derived && (
        <>
          <section className={`${panel} space-y-4 p-5`}>
            <h2 className={sectionTitle}>Automatic news analyses</h2>
            <p className="text-sm text-neutral-600">
              New feed items are analyzed automatically. AI summaries require human review.
            </p>
            {data.analyses.filter((analysis) => analysis.parameters?.kind === "automatic-news")
              .length === 0 ? (
              <p className="text-sm text-neutral-500">
                No automatic analyses in the recent activity.
              </p>
            ) : (
              data.analyses
                .filter((analysis) => analysis.parameters?.kind === "automatic-news")
                .slice(0, 5)
                .map((analysis) => (
                  <article key={analysis.id} className="border-t border-neutral-200 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{analysis.title}</h3>
                      <Badge>{analysis.status}</Badge>
                    </div>
                    {typeof analysis.result?.summary === "string" && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                        {analysis.result.summary}
                      </p>
                    )}
                    {analysis.status === "failed" && (
                      <p className="mt-2 text-sm text-red-700">
                        {analysis.error_message ?? "Analysis failed."} The job will be retried.
                      </p>
                    )}
                    {typeof analysis.parameters?.url === "string" &&
                      analysis.parameters.url.startsWith("https://") && (
                        <a
                          href={analysis.parameters.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm underline"
                        >
                          View source
                        </a>
                      )}
                  </article>
                ))
            )}
          </section>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Sources"
              value={data.sourcesTotal}
              icon={Database}
              sub={`${derived.activeSources} active on loaded page`}
            />
            <StatCard
              label="Analyses Running"
              value={derived.running}
              icon={BarChart3}
              sub={`${data.analyses.length} analyses total`}
            />
            <StatCard
              label="Published Reports"
              value={derived.published}
              icon={FileText}
              sub={`${data.reportsTotal} reports in total`}
            />
            <StatCard
              label="Key Indicators"
              value={data.indicatorsTotal}
              icon={TrendingUp}
              sub="In the indicator registry"
            />
            <StatCard
              label="Forecasts"
              value={data.forecasts}
              icon={Activity}
              sub="Stored projections"
            />
            <StatCard
              label="Scenarios"
              value={data.scenarios}
              icon={GitBranch}
              sub="Saved pathways"
            />
            <StatCard
              label="AI Workflows"
              value={data.workflowsTotal}
              icon={Sparkles}
              sub="Ollama analyses"
            />
            <StatCard
              label="Completed Workflows"
              value={data.workflows.filter((w) => w.status === "completed").length}
              icon={CheckCircle2}
              sub="Among the latest 50"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`${panel} p-6`}>
              {derived.analysesByStatus.length ? (
                <SummaryChart
                  data={derived.analysesByStatus}
                  title="Analyses by status"
                  color="#1478fd"
                />
              ) : (
                <>
                  <h2 className={sectionTitle}>Analyses by status</h2>
                  <EmptyState icon={BarChart3} title="No analyses yet" />
                </>
              )}
            </div>
            <div className={`${panel} p-6`}>
              {derived.sourcesByType.length ? (
                <SummaryChart
                  data={derived.sourcesByType}
                  title="Sources by type"
                  color="#020202"
                />
              ) : (
                <>
                  <h2 className={sectionTitle}>Sources by type</h2>
                  <EmptyState icon={Database} title="No sources yet" />
                </>
              )}
            </div>
          </div>

          <div className={panel}>
            <div className="border-b border-[#12306a] px-6 py-4">
              <h2 className={sectionTitle}>Recent activity</h2>
            </div>
            {derived.feed.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nothing yet"
                text="Analyses, reports and AI workflows will appear here as they are created."
              />
            ) : (
              <ul className="divide-y divide-[#12306a]/70">
                {derived.feed.map((i) => {
                  const K = KIND[i.kind];
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="rounded-lg bg-white p-2 text-black">
                          <K.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-black">{i.title}</p>
                          <p className="text-xs text-black]">
                            {K.label} · {timeAgo(i.at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        tone={
                          i.status === "completed" || i.status === "published"
                            ? "success"
                            : i.status === "failed"
                              ? "danger"
                              : i.status === "running"
                                ? "info"
                                : "neutral"
                        }
                      >
                        {i.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
