/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Database, Search, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, type SourceRow } from '@open-polityra/api-client'
import { PageHeader, StatCard, EmptyState, LoadingBlock, ErrorNote, Badge, panel, sectionTitle, inputClass, chip, btnGhost, th, pick, pickTotal } from '@/components/dashboard/kit'

const PAGE = 20
const TYPES = ['primary', 'secondary', 'tertiary']

export default function SourcesClient() {
  const [sources, setSources] = useState<SourceRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.sources.list({ limit: PAGE, offset: (page - 1) * PAGE, category: category || undefined })
        if (cancelled) return
        const rows = pick<SourceRow>(res, 'sources')
        setSources(rows); setTotal(pickTotal(res, rows.length)); setError(false)
        setCategories((prev) => [...new Set([...prev, ...rows.map((r) => r.category).filter(Boolean) as string[]])].sort())
      } catch { if (!cancelled) { setSources([]); setTotal(0); setError(true) } }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [page, category])

  const visible = useMemo(() => sources.filter((s) =>
    (!type || s.data_type === type) &&
    (!search || `${s.name} ${s.publisher ?? ''} ${s.category ?? ''}`.toLowerCase().includes(search.toLowerCase()))), [sources, type, search])
  const active = sources.filter((s) => s.is_active).length
  const pages = Math.max(1, Math.ceil(total / PAGE))

  return (
    <div className="space-y-8">
      <PageHeader title="Source" accent="Explorer" description="Browse and inspect all verified data sources registered across research domains." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total sources" value={loading ? '—' : total} icon={Database} />
        <StatCard label="Active (this page)" value={loading ? '—' : active} icon={CheckCircle2} />
        {TYPES.slice(0, 2).map((t) => <StatCard key={t} label={`${t} (this page)`} value={loading ? '—' : sources.filter((s) => s.data_type === t).length} icon={Database} />)}
      </div>

      <div className={`${panel} space-y-4 p-5`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74829f]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, publisher or category…" aria-label="Search sources" className={`${inputClass} pl-9`} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-[#74829f]">Type</span>
          <button type="button" className={chip(!type)} onClick={() => setType('')}>All</button>
          {TYPES.map((t) => <button key={t} type="button" aria-pressed={type === t} className={`${chip(type === t)} capitalize`} onClick={() => setType(type === t ? '' : t)}>{t}</button>)}
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-[#74829f]">Category</span>
            <button type="button" className={chip(!category)} onClick={() => { setCategory(''); setPage(1) }}>All</button>
            {categories.map((c) => <button key={c} type="button" aria-pressed={category === c} className={`${chip(category === c)} capitalize`} onClick={() => { setCategory(category === c ? '' : c); setPage(1) }}>{c}</button>)}
          </div>
        )}
      </div>

      <div className={panel}>
        <div className="border-b border-[#12306a] px-6 py-4"><h2 className={sectionTitle}>Source registry</h2></div>
        {loading ? <LoadingBlock label="Loading sources…" /> : error ? (
          <div className="p-6"><ErrorNote>Failed to load sources from the backend.</ErrorNote></div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Database} title="No sources found" text="Try different filters or search terms." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-[#12306a]">{['Source', 'Type', 'Publisher', 'Category', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#12306a]/70">
                {visible.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-3.5 font-medium text-[#eef2fc]">{s.name}</td>
                    <td className="px-6 py-3.5"><Badge tone={s.data_type === 'primary' ? 'info' : 'neutral'}>{s.data_type}</Badge></td>
                    <td className="px-6 py-3.5 text-[#9aa8c7]">{s.publisher || '—'}</td>
                    <td className="px-6 py-3.5 capitalize text-[#9aa8c7]">{s.category || '—'}</td>
                    <td className="px-6 py-3.5"><Badge tone={s.is_active ? 'success' : 'danger'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <div className="flex items-center justify-between border-t border-[#12306a] px-6 py-4">
            <p className="text-sm text-[#74829f]">Showing {visible.length} of {total} sources</p>
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
