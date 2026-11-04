import {
  BarChart3, Globe2, GitBranch, FileText, TrendingUp, Wrench,
  PlayCircle, Loader2, CheckCircle2, XCircle, AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import type { AiWorkflowType } from '@open-polityra/api-client';

export const WORKFLOW_TYPES: { value: AiWorkflowType; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'economic-analysis', label: 'Economic Analysis', description: 'Analyze economic data and generate forecasts', icon: BarChart3 },
  { value: 'geopolitical-assessment', label: 'Geopolitical Assessment', description: 'Assess geopolitical risks and actor dynamics', icon: Globe2 },
  { value: 'scenario-generation', label: 'Scenario Generation', description: 'Generate plausible strategic scenarios', icon: GitBranch },
  { value: 'text-summary', label: 'Text Summary', description: 'Summarize research documents and reports', icon: FileText },
  { value: 'forecast', label: 'Forecast', description: 'Generate predictions with confidence intervals', icon: TrendingUp },
  { value: 'custom', label: 'Custom Analysis', description: 'Free-form analysis with custom prompts', icon: Wrench },
];

export const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = Object.fromEntries(
  WORKFLOW_TYPES.map((t) => [t.value, { label: t.label, icon: t.icon }]),
);

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon; spin?: boolean }> = {
  pending: { label: 'Pending', color: 'border-[#74829f]/30 bg-[#74829f]/10 text-[#c4cfe6]', icon: PlayCircle },
  running: { label: 'Running', color: 'border-[#41cbfd]/30 bg-[#1478fd]/15 text-[#a3ecff]', icon: Loader2, spin: true },
  completed: { label: 'Completed', color: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#86efac]', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fca5a5]', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fcd34d]', icon: AlertTriangle },
};

export const STATUS_KEYS = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;

/** Shared form-control and surface classes */
export const inputClass =
  'w-full rounded-lg border border-[#12306a] bg-[#061230] px-3 py-2.5 text-sm text-[#eef2fc] outline-none transition placeholder:text-[#74829f] focus:border-[#1478fd] focus:ring-2 focus:ring-[#1478fd]/30';
export const panelClass = 'rounded-xl border border-[#12306a] bg-[#0a1a3d]';
export const labelClass = 'mb-1.5 block text-sm font-medium text-[#c4cfe6]';
