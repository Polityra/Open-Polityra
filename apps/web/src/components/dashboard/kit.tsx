/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { ElementType, ReactNode } from "react";
import { Loader2, AlertTriangle, Info } from "lucide-react";

/* ── Shared design system ── */

export const panel = "rounded-xl border border-neutral-200 bg-white";

export const sectionTitle =
  "font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-500";

export const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 hover:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40";

export const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
  }`;

export const th =
  "px-6 py-3 font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-500";

/* ── Badges ── */

const TONES = {
  success: "border-neutral-200 bg-neutral-100 text-neutral-700",
  warning: "border-neutral-200 bg-neutral-100 text-neutral-700",
  danger: "border-neutral-300 bg-neutral-200 text-neutral-900",
  info: "border-neutral-200 bg-neutral-50 text-neutral-600",
  neutral: "border-neutral-200 bg-white text-neutral-500",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Layout pieces ── */

export function PageHeader({
  title,
  accent,
  description,
  action,
}: {
  title: string;
  accent: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-light tracking-tight text-neutral-950">
          {title} <strong className="font-semibold">{accent}</strong>
        </h1>

        <div className="mt-3 h-px w-12 bg-neutral-900" />

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">{description}</p>
      </div>

      {action}
    </div>
  );
}

/* ── Statistics ── */

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  sub?: string;
}) {
  return (
    <div className={`${panel} p-5 transition-colors hover:border-neutral-300`}>
      <div className="flex items-center justify-between gap-3">
        <span className={sectionTitle}>{label}</span>

        <span className="text-neutral-400">
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </span>
      </div>

      <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>

      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

/* ── Empty state ── */

export function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType;
  title: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="text-black">
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </span>

      <p className="mt-4 text-sm font-medium text-black">{title}</p>

      {text && <p className="mt-1 max-w-md text-xs leading-relaxed text-neutral-500">{text}</p>}
    </div>
  );
}

/* ── Loading state ── */

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center py-14">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-500" strokeWidth={1.5} />

      <span className="mt-3 text-xs text-neutral-500">{label}</span>
    </div>
  );
}

/* ── Error message ── */

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />

      <div>{children}</div>
    </div>
  );
}

/* ── Information message ── */

export function InfoNote({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning";
}) {
  const cls =
    tone === "warning"
      ? "border-neutral-300 bg-neutral-100 text-neutral-700"
      : "border-neutral-200 bg-neutral-50 text-neutral-600";

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs leading-relaxed ${cls}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />

      <div>{children}</div>
    </div>
  );
}

/* ── Data helpers ── */

export function pick<T>(res: unknown, key: string): T[] {
  const r = res as any;
  const v = r?.[key] ?? r?.data?.[key];

  return Array.isArray(v) ? (v as T[]) : [];
}

export function pickTotal(res: unknown, fallback: number): number {
  const r = res as any;
  const t = r?.meta?.total ?? r?.data?.meta?.total;

  return typeof t === "number" ? t : fallback;
}

export function fmtDate(d?: string | null) {
  if (!d) return "—";

  const t = new Date(d);

  return Number.isNaN(t.getTime()) ? "—" : t.toLocaleDateString();
}

export function timeAgo(d?: string | null) {
  if (!d) return "";

  const ms = Date.now() - new Date(d).getTime();

  if (Number.isNaN(ms)) return "";

  const m = Math.max(0, Math.floor(ms / 60000));

  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;

  const h = Math.floor(m / 60);

  if (h < 24) return `${h} h ago`;

  return `${Math.floor(h / 24)} d ago`;
}
