/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, Globe2, Layers, Database, FileText, CheckCircle2, Radar, ArrowRight } from 'lucide-react'
import { api, type SourceRow, type ReportRow } from '@open-polityra/api-client'
import { PageHeader, StatCard, EmptyState, LoadingBlock, ErrorNote, InfoNote, Badge, panel, sectionTitle, th, pick, fmtDate, type Tone } from './kit'

type Domain = 'security' | 'geopolitics' | 'resilience'

const DOMAINS: Record<Domain, { title: string; accent: string; description: string; icon: any; match: RegExp; noun: string }> = {
  security: { title: 'Security', accent: 'Research', description: 'Threat assessment, capability tracking, and vulnerability analysis across all domains.', icon: ShieldAlert, noun: 'security', match: /secur|cyber|defen[cs]e|military|threat|intelligen|sigint|terror|arms/i },
  geopolitics: { title: 'Geopolitical', accent: 'Analysis', description: 'Monitoring diplomatic relations, alliance dynamics, and territorial disputes across research domains.', icon: Globe2, noun: 'geopolitical', match: /geopolit|diplomat|alliance|treaty|nato|sanction|border|foreign|united nations|\beu\b/i },
  resilience: { title: 'Resilience', accent: 'Monitoring', description: 'Tracking economic, social, institutional, and infrastructure resilience indicators.', icon: Layers, noun: 'resilience', match: /resilien|infrastructure|energy|emergency|crisis|supply|disaster|health|water/i },
}
const REPORT_TONE: Record<string, Tone> = { published: 'success', reviewing: 'warning', draft: 'neutral' }

/** Shows the real sources and reports in the database that relate to this domain. */
export default function DomainView({ domain }: { domain: Domain }) {
  const cfg = DOMAINS[domain]
  const [sources, setSources] = useState<SourceRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [s, r] = await Promise.allSettled([api.sources.list({ limit: 100 }), api.reports.list({ limit: 100 })] as any)
      if (cancelled) return
      if (s.status === 'rejected' && r.status === 'rejected') setError(true)
      if (s.status === 'fulfilled') setSources(pick<SourceRow>(s.value, 'sources'))
      if (r.status === 'fulfilled') setReports(pick<ReportRow>(r.value, 'reports'))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const mSources = useMemo(() => sources.filter((x) => cfg.match.test(`${x.name} ${x.publisher ?? ''} ${x.category ?? ''}`)), [sources, cfg])
  const mReports = useMemo(() => reports.filter((x) => cfg.match.test(x.title ?? '')), [reports, cfg])
  const Icon = cfg.icon

  return (
    <div className="space-y-8">
      <PageHeader title={cfg.title} accent={cfg.accent} description={cfg.description} />

      {error && <ErrorNote>Couldn&apos;t reach the backend. Check that the API is running, then refresh.</ErrorNote>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Linked sources" value={loading ? '—' : mSources.length} icon={Database} sub={`${cfg.noun} registry matches`} />
        <StatCard label="Active sources" value={loading ? '—' : mSources.filter((x) => x.is_active).length} icon={CheckCircle2} />
        <StatCard label="Related reports" value={loading ? '—' : mReports.length} icon={FileText} />
        <StatCard label="Published" value={loading ? '—' : mReports.filter((x) => x.status === 'published').length} icon={Icon} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panel}>
          <div className="border-b border-[#12306a] px-6 py-4"><h2 className={sectionTitle}>Linked data sources</h2></div>
          {loading ? <LoadingBlock /> : mSources.length === 0 ? (
            <EmptyState icon={Database} title={`No ${cfg.noun} sources yet`} text="Register sources with a matching name or category and they will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-[#12306a]">{['Source', 'Type', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-[#12306a]/70">
                  {mSources.slice(0, 12).map((x) => (
                    <tr key={x.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-6 py-3"><p className="font-medium text-[#eef2fc]">{x.name}</p><p className="text-xs text-[#74829f]">{x.publisher || '—'}</p></td>
                      <td className="px-6 py-3"><Badge tone={x.data_type === 'primary' ? 'info' : 'neutral'}>{x.data_type}</Badge></td>
                      <td className="px-6 py-3"><Badge tone={x.is_active ? 'success' : 'danger'}>{x.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {mSources.length > 12 && <Link href="/dashboard/sources" className="flex items-center justify-end gap-1 border-t border-[#12306a] px-6 py-3 text-xs font-medium text-[#41cbfd] hover:underline">View all {mSources.length} <ArrowRight className="h-3 w-3" /></Link>}
        </div>

        <div className={panel}>
          <div className="border-b border-[#12306a] px-6 py-4"><h2 className={sectionTitle}>Related reports</h2></div>
          {loading ? <LoadingBlock /> : mReports.length === 0 ? (
            <EmptyState icon={FileText} title={`No ${cfg.noun} reports yet`} text="Reports whose titles mention this domain will appear here." />
          ) : (
            <ul className="divide-y divide-[#12306a]/70">
              {mReports.slice(0, 8).map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-[#eef2fc]">{x.title}</p><p className="text-xs text-[#74829f]">{fmtDate(x.created_at)}</p></div>
                  <Badge tone={REPORT_TONE[x.status] ?? 'neutral'}><span className="capitalize">{x.status}</span></Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <InfoNote tone="warning">
        <span className="font-semibold"><Radar className="mr-1 inline h-3.5 w-3.5" />Live {cfg.noun} indicators are not connected yet.</span>{' '}
        This page shows real sources and reports from the database. Threat levels, scores and regional hotspots will appear once the backend stores and serves that data.
      </InfoNote>
    </div>
  )
}
