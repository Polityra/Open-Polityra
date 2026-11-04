/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import type { ElementType, ReactNode } from 'react'
import { Loader2, AlertTriangle, Info } from 'lucide-react'

/* ── Shared surface + control classes (match the AI Workflows page) ── */
export const panel = 'rounded-xl border border-[#12306a] bg-[#0a1a3d]'
export const sectionTitle = 'font-mono text-xs font-semibold uppercase tracking-wider text-[#74829f]'
export const inputClass =
  'w-full rounded-lg border border-[#12306a] bg-[#061230] px-3 py-2.5 text-sm text-[#eef2fc] outline-none transition placeholder:text-[#74829f] focus:border-[#1478fd] focus:ring-2 focus:ring-[#1478fd]/30'
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#1478fd] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0b5fd9] hover:shadow-[0_0_24px_rgba(20,120,253,0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none'
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#12306a] bg-[#061230] px-3 py-1.5 text-sm text-[#c4cfe6] transition hover:border-[#324c80] hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
export const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
    active
      ? 'border-[#1478fd] bg-[#1478fd] text-white'
      : 'border-[#12306a] bg-[#061230] text-[#9aa8c7] hover:border-[#324c80] hover:text-[#eef2fc]'
  }`
export const th = 'px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#74829f]'

/* ── Badges ── */
const TONES = {
  success: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#86efac]',
  warning: 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fcd34d]',
  danger: 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fca5a5]',
  info: 'border-[#41cbfd]/30 bg-[#1478fd]/15 text-[#a3ecff]',
  neutral: 'border-[#74829f]/30 bg-[#74829f]/10 text-[#c4cfe6]',
} as const
export type Tone = keyof typeof TONES

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  )
}

/* ── Layout pieces ── */
export function PageHeader({
  title, accent, description, action,
}: { title: string; accent: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-light tracking-tight text-white">
          {title} <strong className="font-semibold">{accent}</strong>
        </h1>
        <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-[#32b2f7] to-[#3468f5]" />
        <p className="mt-3 max-w-2xl text-sm text-[#9aa8c7]">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label, value, icon: Icon, sub,
}: { label: string; value: string | number; icon: ElementType; sub?: string }) {
  return (
    <div className={`${panel} p-5 transition-colors hover:border-[#1478fd]`}>
      <div className="flex items-center justify-between">
        <span className={sectionTitle}>{label}</span>
        <span className="rounded-md bg-[#1478fd]/15 p-1.5 text-[#41cbfd]"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#74829f]">{sub}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text }: { icon: ElementType; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="rounded-xl bg-[#1478fd]/15 p-3 text-[#41cbfd]"><Icon className="h-6 w-6" /></span>
      <p className="mt-4 text-sm font-semibold text-[#eef2fc]">{title}</p>
      {text && <p className="mt-1 max-w-md text-xs text-[#74829f]">{text}</p>}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center py-14">
      <Loader2 className="h-7 w-7 animate-spin text-[#41cbfd]" />
      <span className="mt-3 text-xs text-[#74829f]">{label}</span>
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fca5a5]">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function InfoNote({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  const cls = tone === 'warning'
    ? 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fcd34d]'
    : 'border-[#41cbfd]/25 bg-[#1478fd]/10 text-[#a3ecff]'
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-xs leading-relaxed ${cls}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

/* ── Data helpers: the API has returned both `res.items` and `res.data.items` ── */
export function pick<T>(res: unknown, key: string): T[] {
  const r = res as any
  const v = r?.[key] ?? r?.data?.[key]
  return Array.isArray(v) ? (v as T[]) : []
}
export function pickTotal(res: unknown, fallback: number): number {
  const r = res as any
  const t = r?.meta?.total ?? r?.data?.meta?.total
  return typeof t === 'number' ? t : fallback
}
export function fmtDate(d?: string | null) {
  if (!d) return '—'
  const t = new Date(d)
  return Number.isNaN(t.getTime()) ? '—' : t.toLocaleDateString()
}
export function timeAgo(d?: string | null) {
  if (!d) return ''
  const ms = Date.now() - new Date(d).getTime()
  if (Number.isNaN(ms)) return ''
  const m = Math.max(0, Math.floor(ms / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.floor(h / 24)} d ago`
}
