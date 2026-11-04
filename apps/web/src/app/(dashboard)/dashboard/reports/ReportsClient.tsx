/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState } from 'react'
import { FileText, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, type ReportRow } from '@open-polityra/api-client'
import { PageHeader, EmptyState, LoadingBlock, ErrorNote, Badge, panel, chip, btnPrimary, btnGhost, pick, pickTotal, fmtDate, type Tone } from '@/components/dashboard/kit'

const PAGE = 20
const STATUSES = ['published', 'reviewing', 'draft']
const TONE: Record<string, Tone> = { published: 'success', reviewing: 'warning', draft: 'neutral' }

export default function ReportsClient() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.reports.list({ limit: PAGE, offset: (page - 1) * PAGE, status: status || undefined })
        if (cancelled) return
        const rows = pick<ReportRow>(res, 'reports')
        setReports(rows); setTotal(pickTotal(res, (page - 1) * PAGE + rows.length)); setError(false)
      } catch { if (!cancelled) { setReports([]); setTotal(0); setError(true) } }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [status, page])

  const pages = Math.max(1, Math.ceil(total / PAGE))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Research" accent="Reports"
        description="Published and draft research reports. All analysis follows peer review standards."
        action={<button type="button" disabled title="Report authoring isn't available yet" className={btnPrimary}><Plus className="h-4 w-4" /> New report</button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={chip(!status)} onClick={() => { setStatus(''); setPage(1) }}>All</button>
        {STATUSES.map((s) => <button key={s} type="button" aria-pressed={status === s} className={`${chip(status === s)} capitalize`} onClick={() => { setStatus(status === s ? '' : s); setPage(1) }}>{s}</button>)}
      </div>

      <div className={panel}>
        {loading ? <LoadingBlock label="Loading reports…" /> : error ? (
          <div className="p-6"><ErrorNote>Failed to load reports from the backend.</ErrorNote></div>
        ) : reports.length === 0 ? (
          <EmptyState icon={FileText} title={status ? 'No reports match this filter' : 'No reports yet'} text={status ? 'Try another status.' : 'Reports stored in the database will appear here.'} />
        ) : (
          <ul className="divide-y divide-[#12306a]/70">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.03]">
                <span className="rounded-lg bg-[#1478fd]/15 p-2.5 text-[#41cbfd]"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#eef2fc]">{r.title}</p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-[#74829f]">
                    <span className="font-mono">{r.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(r.created_at)}</span>
                  </p>
                </div>
                <Badge tone={TONE[r.status] ?? 'neutral'}><span className="capitalize">{r.status}</span></Badge>
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between border-t border-[#12306a] px-6 py-4">
            <p className="text-sm text-[#74829f]">Showing {reports.length} of {total} reports</p>
            <div className="flex items-center gap-2">
              <button type="button" className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <span className="font-mono text-xs text-[#9aa8c7]">{page} / {pages}</span>
              <button type="button" className={btnGhost} disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
