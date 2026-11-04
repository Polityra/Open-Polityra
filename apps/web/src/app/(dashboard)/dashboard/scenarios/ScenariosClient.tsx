/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState } from 'react'
import { Plus, GitBranch, TrendingUp, Zap, ArrowRightLeft, Sprout } from 'lucide-react'
import { api, type ScenarioRow } from '@open-polityra/api-client'
import { PageHeader, EmptyState, LoadingBlock, ErrorNote, InfoNote, panel, sectionTitle, btnPrimary, th, pick, fmtDate } from '@/components/dashboard/kit'

// Reference templates (documentation of scenario archetypes, not database records)
const templates = [
  { name: 'Baseline', icon: TrendingUp, description: 'Continuation of current trends with minimal disruption', parameters: ['trend_continuation', 'gradual_change'] },
  { name: 'High Stress', icon: Zap, description: 'Severe shock events across multiple domains simultaneously', parameters: ['systemic_shock', 'multi_domain_failure'] },
  { name: 'Transition', icon: ArrowRightLeft, description: 'Gradual structural shift with moderate disruption', parameters: ['structural_shift', 'managed_transition'] },
  { name: 'Optimistic Growth', icon: Sprout, description: 'Favorable conditions with positive developments across indicators', parameters: ['favorable_conditions', 'innovation_boost'] },
]

export default function ScenariosClient() {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.scenarios.list({ limit: 50 })
        if (!cancelled) setScenarios(pick<ScenarioRow>(res, 'scenarios'))
      } catch { if (!cancelled) setError(true) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scenario" accent="Modeling"
        description="Construct, compare, and track scenario pathways with editable assumptions. Non-predictive analysis tool."
        action={<button type="button" disabled title="Scenario creation isn't available yet" className={btnPrimary}><Plus className="h-4 w-4" /> New scenario</button>}
      />

      <InfoNote><span className="font-semibold">Note:</span> Scenario modeling produces non-predictive analyses for strategic planning purposes only. Results require human review and domain expertise interpretation.</InfoNote>

      <div className={panel}>
        <div className="border-b border-[#12306a] px-6 py-4"><h2 className={sectionTitle}>Saved scenarios</h2></div>
        {loading ? <LoadingBlock label="Loading scenarios…" /> : error ? (
          <div className="p-6"><ErrorNote>Failed to load scenarios from the backend.</ErrorNote></div>
        ) : scenarios.length === 0 ? (
          <EmptyState icon={GitBranch} title="No scenarios yet" text="Scenarios saved to the database will appear here. Use the templates below as a starting point." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-[#12306a]">{['Scenario', 'Assumptions', 'Parameters', 'Created'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#12306a]/70">
                {scenarios.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-3.5 font-medium text-[#eef2fc]">{s.name}</td>
                    <td className="max-w-xs truncate px-6 py-3.5 text-[#9aa8c7]">{s.description || '—'}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-[#9aa8c7]">{s.parameters ? Object.keys(s.parameters).length : 0} values</td>
                    <td className="px-6 py-3.5 text-[#9aa8c7]">{fmtDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className={`${sectionTitle} mb-3`}>Scenario templates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <div key={t.name} className={`${panel} p-5 transition-colors hover:border-[#1478fd]`}>
              <span className="inline-flex rounded-lg bg-[#1478fd]/15 p-2.5 text-[#41cbfd]"><t.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-base font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#9aa8c7]">{t.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.parameters.map((p) => <span key={p} className="rounded-full border border-[#41cbfd]/20 bg-[#1478fd]/10 px-2 py-0.5 font-mono text-[11px] text-[#a3ecff]">{p}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
