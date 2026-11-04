/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState } from 'react'
import { Plus, BarChart3, Clock, Activity, LineChart, Layers, Waves } from 'lucide-react'
import { api, type ForecastRow } from '@open-polityra/api-client'
import { PageHeader, EmptyState, LoadingBlock, ErrorNote, InfoNote, Badge, panel, sectionTitle, btnPrimary, pick, fmtDate } from '@/components/dashboard/kit'

const methods = [
  { name: 'ARIMA', icon: LineChart, desc: 'Auto-regressive integrated moving average for time series' },
  { name: 'VAR Models', icon: Layers, desc: 'Vector auto-regression for multi-variable forecasting' },
  { name: 'Holt-Winters', icon: Waves, desc: 'Triple exponential smoothing for trend + seasonality' },
]

function Confidence({ lower, upper }: { lower?: number | null; upper?: number | null }) {
  if (lower == null && upper == null) return <Badge tone="neutral">Unrated</Badge>
  const hi = upper ?? lower ?? 0
  const tone = hi > 80 ? 'success' : hi > 50 ? 'warning' : 'danger'
  return <Badge tone={tone}>{hi > 80 ? 'High' : hi > 50 ? 'Medium' : 'Low'}</Badge>
}

export default function ForecastingClient() {
  const [forecasts, setForecasts] = useState<ForecastRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.forecasts.list({ limit: 50 })
        if (!cancelled) setForecasts(pick<ForecastRow>(res, 'forecasts'))
      } catch { if (!cancelled) setError(true) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Strategic" accent="Forecasting"
        description="Quantitative projections with uncertainty intervals across monitored domains."
        action={<button type="button" disabled title="Forecast creation isn't available yet" className={btnPrimary}><Plus className="h-4 w-4" /> New forecast</button>}
      />

      <div className={panel}>
        <div className="border-b border-[#12306a] px-6 py-4"><h2 className={sectionTitle}>Stored forecasts</h2></div>
        {loading ? <LoadingBlock label="Loading forecasts…" /> : error ? (
          <div className="p-6"><ErrorNote>Failed to load forecasts from the backend.</ErrorNote></div>
        ) : forecasts.length === 0 ? (
          <EmptyState icon={Activity} title="No forecasts yet" text="Forecasts produced by analyses will appear here with their method and confidence interval." />
        ) : (
          <ul className="divide-y divide-[#12306a]/70">
            {forecasts.map((f) => {
              const lo = f.confidence_lower, hi = f.confidence_upper
              return (
                <li key={f.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#eef2fc]">{f.target}</p>
                      <p className="mt-0.5 font-mono text-xs text-[#74829f]">Analysis {f.analysis_id?.slice(0, 8)}</p>
                    </div>
                    <Confidence lower={lo} upper={hi} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#9aa8c7]">
                    <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-[#41cbfd]" />{f.method}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#41cbfd]" />{fmtDate(f.created_at)}</span>
                    <span className="font-mono">Interval [{lo?.toFixed(0) ?? '?'}, {hi?.toFixed(0) ?? '?'}]</span>
                  </div>
                  {lo != null && hi != null && (
                    <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#12306a]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#1478fd] to-[#41cbfd]" style={{ marginLeft: `${Math.min(100, Math.max(0, lo))}%`, width: `${Math.min(100, Math.max(2, hi - lo))}%` }} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div>
        <h2 className={`${sectionTitle} mb-3`}>Available forecasting methods</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {methods.map((m) => (
            <div key={m.name} className={`${panel} p-5 transition-colors hover:border-[#1478fd]`}>
              <span className="inline-flex rounded-lg bg-[#1478fd]/15 p-2.5 text-[#41cbfd]"><m.icon className="h-5 w-5" /></span>
              <p className="mt-3 font-display text-base font-semibold text-white">{m.name}</p>
              <p className="mt-1 text-sm text-[#9aa8c7]">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <InfoNote tone="warning"><span className="font-semibold">Disclaimer:</span> Forecasts are probabilistic projections, not predictions. Confidence intervals reflect statistical uncertainty. All forecasts require human expert review before use in decision-making.</InfoNote>
    </div>
  )
}
