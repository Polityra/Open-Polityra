/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Globe2,
  Layers,
  Database,
  FileText,
  CheckCircle2,
  Radar,
  ArrowRight,
  History,
} from "lucide-react";
import { api, type AnalysisRow, type SourceRow, type ReportRow } from "@open-polityra/api-client";
import {
  PageHeader,
  StatCard,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  InfoNote,
  Badge,
  panel,
  sectionTitle,
  th,
  pick,
  fmtDate,
  type Tone,
} from "./kit";
import AnalysisRunner from "./AnalysisRunner";

type Domain = "security" | "geopolitics" | "resilience";

const DOMAINS: Record<
  Domain,
  {
    title: string;
    accent: string;
    description: string;
    icon: any;
    match: RegExp;
    noun: string;
  }
> = {
  security: {
    title: "Security",
    accent: "Research",
    description:
      "Threat assessment, capability tracking, and vulnerability analysis across all domains.",
    icon: ShieldAlert,
    noun: "security",
    match: /secur|cyber|defen[cs]e|military|threat|intelligen|sigint|terror|arms/i,
  },
  geopolitics: {
    title: "Geopolitical",
    accent: "Analysis",
    description:
      "Monitoring diplomatic relations, alliance dynamics, and territorial disputes across research domains.",
    icon: Globe2,
    noun: "geopolitical",
    match: /geopolit|diplomat|alliance|treaty|nato|sanction|border|foreign|united nations|\beu\b/i,
  },
  resilience: {
    title: "Resilience",
    accent: "Monitoring",
    description:
      "Tracking economic, social, institutional, and infrastructure resilience indicators.",
    icon: Layers,
    noun: "resilience",
    match: /resilien|infrastructure|energy|emergency|crisis|supply|disaster|health|water/i,
  },
};

const REPORT_TONE: Record<string, Tone> = {
  published: "success",
  reviewing: "warning",
  draft: "neutral",
};

/** Shows the real sources and reports in the database that relate to this domain. */
export default function DomainView({ domain }: { domain: Domain }) {
  const cfg = DOMAINS[domain];
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [s, r, a] = await Promise.allSettled([
        api.sources.list({ limit: 100 }),
        api.reports.list({ limit: 100 }),
        api.analyses.list({ limit: 100 }),
      ] as any);

      if (cancelled) return;

      if (s.status === "rejected" && r.status === "rejected") {
        setError(true);
      }

      if (s.status === "fulfilled") {
        setSources(pick<SourceRow>(s.value, "sources"));
      }

      if (r.status === "fulfilled") {
        setReports(pick<ReportRow>(r.value, "reports"));
      }

      if (a.status === "fulfilled") {
        setAnalyses(pick<AnalysisRow>(a.value, "analyses"));
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const mSources = useMemo(
    () =>
      sources.filter((x) => cfg.match.test(`${x.name} ${x.publisher ?? ""} ${x.category ?? ""}`)),
    [sources, cfg],
  );

  const mReports = useMemo(
    () => reports.filter((x) => cfg.match.test(x.title ?? "")),
    [reports, cfg],
  );

  const mAnalyses = useMemo(
    () =>
      analyses.filter((item) =>
        cfg.match.test(
          `${item.title} ${typeof item.parameters?.topic === "string" ? item.parameters.topic : ""}`,
        ),
      ),
    [analyses, cfg],
  );

  const Icon = cfg.icon;

  return (
    <div className="space-y-8">
      <PageHeader
        title={cfg.title}
        accent={cfg.accent}
        description={cfg.description}
        action={
          <Link href="/dashboard/analyses" className="text-sm font-medium underline">
            View analysis history
          </Link>
        }
      />

      <InfoNote>
        <span className="font-semibold">Workflow:</span> select a focused question, queue the
        analysis, then follow it in Analysis History. Review evidence in Human Reviews before
        turning an AI result into a report.
      </InfoNote>

      {error && (
        <ErrorNote>
          Couldn&apos;t reach the backend. Check that the API is running, then refresh.
        </ErrorNote>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Linked sources"
          value={loading ? "—" : mSources.length}
          icon={Database}
          sub={`${cfg.noun} registry matches`}
        />

        <StatCard
          label="Active sources"
          value={loading ? "—" : mSources.filter((x) => x.is_active).length}
          icon={CheckCircle2}
        />

        <StatCard
          label="Related analyses"
          value={loading ? "—" : mAnalyses.length}
          icon={History}
        />

        <StatCard
          label="Published"
          value={loading ? "—" : mReports.filter((x) => x.status === "published").length}
          icon={Icon}
        />
      </div>

      <AnalysisRunner
        topic={`${cfg.title} ${cfg.noun} domain assessment`}
        sourceIds={mSources.map((source) => source.id).slice(0, 40)}
        reportIds={mReports.map((report) => report.id).slice(0, 40)}
      />

      {/* Sources and reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Linked sources */}
        <div className={panel}>
          <div className="border-b border-black/10 px-6 py-4">
            <h2 className={sectionTitle}>Linked data sources</h2>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : mSources.length === 0 ? (
            <EmptyState
              icon={Database}
              title={`No ${cfg.noun} sources yet`}
              text="Register sources with a matching name or category and they will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10">
                    {["Source", "Type", "Status"].map((h) => (
                      <th key={h} className={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/5">
                  {mSources.slice(0, 12).map((x) => (
                    <tr key={x.id} className="transition-colors hover:bg-neutral-50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-black">{x.name}</p>
                        <p className="text-xs text-neutral-500">{x.publisher || "—"}</p>
                      </td>

                      <td className="px-6 py-3">
                        <Badge tone="neutral">{x.data_type}</Badge>
                      </td>

                      <td className="px-6 py-3">
                        <Badge tone={x.is_active ? "success" : "danger"}>
                          {x.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mSources.length > 12 && (
            <Link
              href="/dashboard/sources"
              className="flex items-center justify-end gap-1 border-t border-black/10 px-6 py-3 text-xs font-medium text-neutral-600 transition hover:text-black"
            >
              View all {mSources.length}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Related analyses and reports */}
        <div className={panel}>
          <div className="border-b border-black/10 px-6 py-4">
            <h2 className={sectionTitle}>Related work</h2>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : mAnalyses.length === 0 && mReports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={`No ${cfg.noun} work saved yet`}
              text="Queue the first analysis above. It will remain visible in history while the worker completes it."
            />
          ) : (
            <ul className="divide-y divide-black/5">
              {mAnalyses.slice(0, 5).map((analysis) => (
                <li key={analysis.id}>
                  <Link
                    href={`/dashboard/analyses/${analysis.id}`}
                    className="flex items-center justify-between gap-3 px-6 py-3.5 transition-colors hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black">{analysis.title}</p>
                      <p className="text-xs text-neutral-500">{fmtDate(analysis.updated_at)}</p>
                    </div>
                    <Badge tone={analysis.status === "completed" ? "success" : "neutral"}>
                      Analysis · {analysis.status}
                    </Badge>
                  </Link>
                </li>
              ))}
              {mReports.slice(0, 8).map((x) => (
                <li
                  key={x.id}
                  className="flex items-center justify-between gap-3 px-6 py-3.5 transition-colors hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-black">{x.title}</p>
                    <p className="text-xs text-neutral-500">{fmtDate(x.created_at)}</p>
                  </div>

                  <Badge tone={REPORT_TONE[x.status] ?? "neutral"}>
                    <span className="capitalize">{x.status}</span>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Domain information */}
      <InfoNote tone="warning">
        <span className="font-semibold">
          <Radar className="mr-1 inline h-3.5 w-3.5" />
          Live {cfg.noun} indicators are not connected yet.
        </span>{" "}
        This page shows real sources and reports from the database. Threat levels, scores and
        regional hotspots will appear once the backend stores and serves that data.
      </InfoNote>
    </div>
  );
}
