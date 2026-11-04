'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Calendar, Ruler, Search } from 'lucide-react'
import { api, type IndicatorRow } from '@open-polityra/api-client'
import { PageHeader, StatCard, EmptyState, LoadingBlock, ErrorNote, InfoNote, Badge, panel, sectionTitle, inputClass, th } from '@/components/dashboard/kit'
import { pick, pickTotal } from '@/components/dashboard/kit'
import FiscalBalanceExplorer from './FiscalBalanceExplorer'

export default function EconomyClient() {
  const [indicators, setIndicators] = useState<IndicatorRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.indicators.list({ limit: 100, offset: 0 })
        if (cancelled) return
        const rows = pick<IndicatorRow>(res, 'indicators')
        setIndicators(rows); setTotal(pickTotal(res, rows.length))
      } catch { if (!cancelled) setError(true) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const visible = indicators.filter((i) => !q || `${i.name} ${i.unit ?? ''} ${i.frequency ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const frequencies = new Set(indicators.map((i) => i.frequency).filter(Boolean))

  return (
    <div className="space-y-8">
      <PageHeader title="Economic" accent="Analysis" description="Macroeconomic indicators tracked in the platform registry." />
      <FiscalBalanceExplorer />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Indicators" value={loading ? '—' : total} icon={TrendingUp} sub="In the registry" />
        <StatCard label="Update frequencies" value={loading ? '—' : frequencies.size} icon={Calendar} sub={[...frequencies].slice(0, 3).join(', ') || 'None recorded'} />
        <StatCard label="Showing" value={loading ? '—' : visible.length} icon={Ruler} sub={q ? 'Matching your search' : 'Latest 100'} />
      </div>

      <div className={panel}>
        <div className="flex flex-col gap-3 border-b border-[#12306a] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionTitle}>Indicator registry</h2>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74829f]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search indicators…" aria-label="Search indicators" className={`${inputClass} pl-9`} />
          </div>
        </div>
        {loading ? <LoadingBlock /> : error ? (
          <div className="p-6"><ErrorNote>Failed to load indicators from the backend.</ErrorNote></div>
        ) : visible.length === 0 ? (
          <EmptyState icon={TrendingUp} title={q ? 'No indicators match your search' : 'No indicators yet'} text={q ? undefined : 'Indicators imported into the database will appear here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-[#12306a]"><th className={th}>Indicator</th><th className={th}>Unit</th><th className={th}>Frequency</th></tr></thead>
              <tbody className="divide-y divide-[#12306a]/70">
                {visible.map((i) => (
                  <tr key={i.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-3.5 font-medium text-[#eef2fc]">{i.name}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-[#9aa8c7]">{i.unit || '—'}</td>
                    <td className="px-6 py-3.5">{i.frequency ? <Badge tone="info">{i.frequency}</Badge> : <span className="text-[#74829f]">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InfoNote>Data comes from the indicator registry in the backend database. Values and time series appear here once observations are stored for each indicator.</InfoNote>
    </div>
  )
}
