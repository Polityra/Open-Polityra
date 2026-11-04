/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Database, BarChart3, FileText, TrendingUp, GitBranch, Sparkles, Activity, CheckCircle2, Clock } from 'lucide-react'
import { SummaryChart } from '@/components/charts/SummaryChart'
import { api } from '@open-polityra/api-client'
import {
  PageHeader, StatCard, EmptyState, LoadingBlock, ErrorNote, Badge,
  panel, sectionTitle, pick, pickTotal, timeAgo,
} from '@/components/dashboard/kit'

type Item = { id: string; kind: 'analysis' | 'report' | 'workflow'; title: string; status: string; at: string }
type Data = {
  sources: any[]; sourcesTotal: number; analyses: any[]; reports: any[]; reportsTotal: number
  indicatorsTotal: number; forecasts: number; scenarios: number; workflows: any[]; workflowsTotal: number
}

const KIND = {
  analysis: { icon: BarChart3, label: 'Analysis' },
  report: { icon: FileText, label: 'Report' },
  workflow: { icon: Sparkles, label: 'AI workflow' },
} as const

const count = (rows: any[], key: string) => {
  const m = new Map<string, number>()
  rows.forEach((r) => { const k = String(r?.[key] ?? 'unknown'); m.set(k, (m.get(k) ?? 0) + 1) })
  return [...m].map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
}

export default function DashboardClient() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await Promise.allSettled([
        api.sources.list({ limit: 100 }),
        api.analyses.list(),
        api.reports.list({ limit: 100 }),
        api.indicators.list({ limit: 100 }),
        api.forecasts.list(),
        api.scenarios.list(),
        api.aiWorkflows.list({ limit: 50, offset: 0 }),
      ] as any)
      if (cancelled) return
      if (r.every((x) => x.status === 'rejected')) { setError(true); return }
      const v = (i: number) => (r[i].status === 'fulfilled' ? (r[i] as PromiseFulfilledResult<any>).value : null)
      const sources = pick<any>(v(0), 'sources'), reports = pick<any>(v(2), 'reports'), workflows = pick<any>(v(6), 'workflows')
      setData({
        sources, sourcesTotal: pickTotal(v(0), sources.length),
        analyses: pick<any>(v(1), 'analyses'),
        reports, reportsTotal: pickTotal(v(2), reports.length),
        indicatorsTotal: pickTotal(v(3), pick<any>(v(3), 'indicators').length),
        forecasts: pick<any>(v(4), 'forecasts').length,
        scenarios: pick<any>(v(5), 'scenarios').length,
        workflows, workflowsTotal: pickTotal(v(6), workflows.length),
      })
    })()
    return () => { cancelled = true }
  }, [])

  const derived = useMemo(() => {
    if (!data) return null
    const running = data.analyses.filter((a) => a.status === 'running' || a.status === 'pending').length
    const published = data.reports.filter((x) => x.status === 'published').length
    const activeSources = data.sources.filter((s) => s.is_active).length
    const feed: Item[] = [
      ...data.analyses.map((a) => ({ id: `a${a.id}`, kind: 'analysis' as const, title: `Analysis ${a.status}`, status: a.status, at: a.updated_at ?? a.created_at })),
      ...data.reports.map((x) => ({ id: `r${x.id}`, kind: 'report' as const, title: x.title, status: x.status, at: x.updated_at ?? x.created_at })),
      ...data.workflows.map((w) => ({ id: `w${w.id}`, kind: 'workflow' as const, title: w.title, status: w.status, at: w.updated_at ?? w.created_at })),
    ].filter((i) => i.at).sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 8)
    return {
      running, published, activeSources, feed,
      analysesByStatus: count(data.analyses, 'status'),
      sourcesByType: count(data.sources, 'data_type'),
    }
  }, [data])

  return (
    <div className="space-y-8">
      <PageHeader title="Strategic" accent="Dashboard" description="Live overview of sources, analyses, reports and AI workflows, read directly from the platform database." />

      {error && <ErrorNote>Couldn&apos;t reach the backend. Check that the API is running, then refresh.</ErrorNote>}
      {!data && !error && <div className={panel}><LoadingBlock label="Loading platform data…" /></div>}

      {data && derived && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Sources" value={data.sourcesTotal} icon={Database} sub={`${derived.activeSources} active on loaded page`} />
            <StatCard label="Analyses Running" value={derived.running} icon={BarChart3} sub={`${data.analyses.length} analyses total`} />
            <StatCard label="Published Reports" value={derived.published} icon={FileText} sub={`${data.reportsTotal} reports in total`} />
            <StatCard label="Key Indicators" value={data.indicatorsTotal} icon={TrendingUp} sub="In the indicator registry" />
            <StatCard label="Forecasts" value={data.forecasts} icon={Activity} sub="Stored projections" />
            <StatCard label="Scenarios" value={data.scenarios} icon={GitBranch} sub="Saved pathways" />
            <StatCard label="AI Workflows" value={data.workflowsTotal} icon={Sparkles} sub="Local Ollama analyses" />
            <StatCard label="Completed Workflows" value={data.workflows.filter((w) => w.status === 'completed').length} icon={CheckCircle2} sub="Among the latest 50" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`${panel} p-6`}>
              {derived.analysesByStatus.length ? (
                <SummaryChart data={derived.analysesByStatus} title="Analyses by status" color="#1478fd" />
              ) : (<><h2 className={sectionTitle}>Analyses by status</h2><EmptyState icon={BarChart3} title="No analyses yet" /></>)}
            </div>
            <div className={`${panel} p-6`}>
              {derived.sourcesByType.length ? (
                <SummaryChart data={derived.sourcesByType} title="Sources by type" color="#41cbfd" />
              ) : (<><h2 className={sectionTitle}>Sources by type</h2><EmptyState icon={Database} title="No sources yet" /></>)}
            </div>
          </div>

          <div className={panel}>
            <div className="border-b border-[#12306a] px-6 py-4"><h2 className={sectionTitle}>Recent activity</h2></div>
            {derived.feed.length === 0 ? (
              <EmptyState icon={Clock} title="Nothing yet" text="Analyses, reports and AI workflows will appear here as they are created." />
            ) : (
              <ul className="divide-y divide-[#12306a]/70">
                {derived.feed.map((i) => {
                  const K = KIND[i.kind]
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="rounded-lg bg-[#1478fd]/15 p-2 text-[#41cbfd]"><K.icon className="h-4 w-4" /></span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#eef2fc]">{i.title}</p>
                          <p className="text-xs text-[#74829f]">{K.label} · {timeAgo(i.at)}</p>
                        </div>
                      </div>
                      <Badge tone={i.status === 'completed' || i.status === 'published' ? 'success' : i.status === 'failed' ? 'danger' : i.status === 'running' ? 'info' : 'neutral'}>{i.status}</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
