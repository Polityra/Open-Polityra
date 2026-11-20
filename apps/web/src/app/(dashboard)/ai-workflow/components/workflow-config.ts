import {
  BarChart3,
  Globe2,
  GitBranch,
  FileText,
  TrendingUp,
  Wrench,
  PlayCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { AiWorkflowType } from "@open-polityra/api-client";

export const WORKFLOW_TYPES: {
  value: AiWorkflowType;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "fiscal-explanation",
    label: "Fiscal evidence explanation",
    description:
      "Explain Finland's Eurostat fiscal data and a deterministic scenario, with citations",
    icon: BarChart3,
  },
  {
    value: "source-summary",
    label: "Source summary",
    description: "Summarise a source text you paste in, citing its numbered passages",
    icon: FileText,
  },
];

/** Analyses created before the evidence-grounded redesign; shown read-only. */
const LEGACY_TYPES: Record<string, { label: string; icon: LucideIcon }> = {
  "economic-analysis": { label: "Legacy: economic analysis", icon: BarChart3 },
  "geopolitical-assessment": { label: "Legacy: geopolitical assessment", icon: Globe2 },
  "scenario-generation": { label: "Legacy: scenario generation", icon: GitBranch },
  "text-summary": { label: "Legacy: text summary", icon: FileText },
  forecast: { label: "Legacy: forecast", icon: TrendingUp },
  custom: { label: "Legacy: custom", icon: Wrench },
};

export const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  ...LEGACY_TYPES,
  ...Object.fromEntries(WORKFLOW_TYPES.map((t) => [t.value, { label: t.label, icon: t.icon }])),
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: LucideIcon; spin?: boolean }
> = {
  pending: {
    label: "Pending",
    color: "border-black/10 bg-neutral-100 text-neutral-700",
    icon: PlayCircle,
  },
  running: {
    label: "Running",
    color: "border-neutral-950/20 bg-neutral-100 text-neutral-950",
    icon: Loader2,
    spin: true,
  },
  completed: {
    label: "Completed",
    color: "border-emerald-300 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "border-red-300 bg-red-50 text-red-700",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "border-amber-300 bg-amber-50 text-amber-700",
    icon: AlertTriangle,
  },
};

export const STATUS_KEYS = ["pending", "running", "completed", "failed", "cancelled"] as const;

/** Shared form-control and surface classes */
export const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-black/50 focus:ring-2 focus:ring-black/10";
export const panelClass = "rounded-xl border border-black/10 bg-white";
export const labelClass = "mb-1.5 block text-sm font-medium text-neutral-700";
