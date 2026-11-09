/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api, type AiWorkflowRow } from "@open-polityra/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  Sparkles,
  Loader2,
  ChevronRight,
  Calendar,
  Trash2,
  AlertTriangle,
  Timer,
  Plus,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import {
  STATUS_CONFIG,
  STATUS_KEYS,
  TYPE_CONFIG,
  WORKFLOW_TYPES,
  panelClass,
} from "./workflow-config";

interface WorkflowListProps {
  onSelectWorkflow?: (id: string) => void;
}

const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
    active
      ? "border-neutral-950 bg-neutral-950 text-white"
      : "border-black/10 bg-neutral-50 text-neutral-600 hover:border-black/30 hover:text-neutral-950"
  }`;

export default function WorkflowList({ onSelectWorkflow }: WorkflowListProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [workflows, setWorkflows] = useState<AiWorkflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const res = await api.aiWorkflows.list({
        limit: 50,
        offset: 0,
        status: statusFilter || undefined,
      });
      setWorkflows(res.workflows ?? []);
      setError(null);
    } catch {
      setError("Failed to load workflows");
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchWorkflows();
  }, [authLoading, fetchWorkflows, isAuthenticated]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this workflow?")) return;
    try {
      await api.aiWorkflows.cancel(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch {
      /* ignore */
    }
  };

  // Type filter is applied client-side; status filter is sent to the API.
  const visible = useMemo(
    () => (typeFilter ? workflows.filter((w) => w.type === typeFilter) : workflows),
    [workflows, typeFilter],
  );
  const hasFilters = !!(statusFilter || typeFilter);

  return (
    <div className={panelClass}>
      {/* Header with filters */}
      <div className="border-b border-black/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-neutral-950">AI analyses</h2>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
              }}
              className="text-xs font-medium text-neutral-950 hover:underline"
            >
              Clear filters ({visible.length})
            </button>
          ) : (
            <span className="font-mono text-xs text-neutral-500">{visible.length} total</span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Status
            </span>
            {STATUS_KEYS.map((key) => {
              const Icon = STATUS_CONFIG[key].icon;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={statusFilter === key}
                  onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
                  className={chip(statusFilter === key)}
                >
                  <Icon className="h-3 w-3" /> {STATUS_CONFIG[key].label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Type
            </span>
            {WORKFLOW_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={typeFilter === t.value}
                onClick={() => setTypeFilter(typeFilter === t.value ? "" : t.value)}
                className={chip(typeFilter === t.value)}
              >
                <t.icon className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-black/[0.08]">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-700" />
          </div>
        ) : error ? (
          <div role="alert" className="flex items-center gap-2 px-6 py-8 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="rounded-xl border border-black/10 bg-neutral-100 p-3 text-neutral-700">
              <Sparkles className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-neutral-950">
              {hasFilters ? "No analyses match these filters" : "No analyses yet"}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              {hasFilters ? (
                "Try clearing a filter."
              ) : (
                <>
                  Use <Plus className="inline h-3 w-3" /> New analysis to get started.
                </>
              )}
            </p>
          </div>
        ) : (
          visible.map((wf) => {
            const typeCfg = TYPE_CONFIG[wf.type] || TYPE_CONFIG.custom;
            const TypeIcon = typeCfg.icon;
            const totalMs =
              wf.result && typeof wf.result === "object" && "totalTimeMs" in wf.result
                ? Number((wf.result as any).totalTimeMs)
                : null;

            return (
              <div
                key={wf.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectWorkflow?.(wf.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectWorkflow?.(wf.id);
                  }
                }}
                className="group flex cursor-pointer items-center justify-between gap-4 px-6 py-4 transition hover:bg-black/[0.03] focus-visible:bg-black/[0.03] focus-visible:outline-none"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="inline-flex shrink-0 rounded-lg border border-black/10 bg-neutral-100 p-2.5 text-neutral-700 transition-colors group-hover:bg-neutral-200">
                    <TypeIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-950 transition-colors group-hover:text-neutral-950">
                      {wf.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span>{typeCfg.label}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(wf.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {totalMs !== null && !Number.isNaN(totalMs) && (
                    <span className="hidden items-center gap-1 font-mono text-xs text-neutral-500 sm:flex">
                      <Timer className="h-3 w-3" />
                      {(totalMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  <StatusBadge status={wf.status} />
                  <button
                    type="button"
                    onClick={(e) => handleDelete(wf.id, e)}
                    className="rounded p-1.5 text-neutral-500 opacity-0 transition hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label="Delete workflow"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-950" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
