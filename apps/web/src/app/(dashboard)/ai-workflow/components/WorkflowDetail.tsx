'use client';

import { useState, useEffect } from 'react';
import { api, type AiWorkflowRow, type WorkflowTaskRow } from '@open-polityra/api-client';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, ChevronDown, Calendar, Bot, AlertCircle, Clock, FileSearch } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { TYPE_CONFIG, panelClass } from './workflow-config';

interface WorkflowDetailProps {
  workflowId: string;
  onBack: () => void;
}

export default function WorkflowDetail({ workflowId, onBack }: WorkflowDetailProps) {
  const [workflow, setWorkflow] = useState<AiWorkflowRow | null>(null);
  const [tasks, setTasks] = useState<WorkflowTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.aiWorkflows.byId(workflowId);
        if (!cancelled) {
          setWorkflow(res.workflow);
          setTasks(res.tasks ?? []);
        }
      } catch { /* ignore */ }
      finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(async () => {
      if (workflow?.status === 'running' || workflow?.status === 'pending') {
        try {
          const res = await api.aiWorkflows.byId(workflowId);
          if (res.workflow.status !== workflow.status) {
            setWorkflow(res.workflow);
            setTasks(res.tasks ?? []);
            clearInterval(interval);
          }
        } catch { /* ignore polling errors */ }
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [workflowId, workflow?.status]);

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm text-[#9aa8c7] transition hover:text-[#41cbfd]"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to analyses
    </button>
  );

  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#41cbfd]" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="space-y-6">
        {backButton}
        <div className={`${panelClass} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="rounded-xl bg-[#ef4444]/10 p-3 text-[#fca5a5]">
            <FileSearch className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold text-[#eef2fc]">Workflow not found</p>
          <p className="mt-1 text-xs text-[#74829f]">It may have been deleted, or you may not have access to it.</p>
        </div>
      </div>
    );
  }

  const wfResult = workflow.result && typeof workflow.result === 'object' ? workflow.result : null;
  const summary = wfResult?.summary as string | undefined;
  const confidence = wfResult?.confidence_level as number | undefined;
  const typeCfg = TYPE_CONFIG[workflow.type] || TYPE_CONFIG.custom;
  const TypeIcon = typeCfg.icon;
  const confColor = confidence === undefined ? '' : confidence >= 0.7 ? 'from-[#22c55e] to-[#86efac]' : confidence >= 0.4 ? 'from-[#f59e0b] to-[#fcd34d]' : 'from-[#ef4444] to-[#fca5a5]';

  return (
    <div className="space-y-6">
      {backButton}

      {/* Workflow header card */}
      <div className={`${panelClass} p-6`}>
        <div className="flex items-start gap-4">
          <span className="inline-flex shrink-0 rounded-xl bg-[#1478fd]/15 p-3 text-[#41cbfd]">
            <TypeIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-semibold text-white">{workflow.title}</h2>
              <StatusBadge status={workflow.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#9aa8c7]">
              <span>{typeCfg.label}</span>
              <span className="flex items-center gap-1.5 font-mono"><Bot className="h-3.5 w-3.5 text-[#41cbfd]" />{workflow.model}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#41cbfd]" />{new Date(workflow.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-5 rounded-lg border border-[#12306a] bg-[#061230] p-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#74829f]">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#c4cfe6]">{summary}</p>
          </div>
        )}

        {/* Confidence */}
        {confidence !== undefined && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-wider text-[#74829f]">Overall confidence</span>
              <span className="font-semibold text-[#eef2fc]">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#12306a]">
              <div className={`h-2 rounded-full bg-gradient-to-r transition-all ${confColor}`} style={{ width: `${confidence * 100}%` }} />
            </div>
          </div>
        )}

        {/* Error */}
        {workflow.error_message && (
          <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#fca5a5]" />
            <div>
              <p className="text-sm font-medium text-[#fca5a5]">Error</p>
              <p className="mt-1 text-xs text-[#fca5a5]/80">{workflow.error_message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Task results */}
      <div>
        <h3 className="font-display text-lg font-semibold text-white">Analysis steps</h3>
        {tasks.length === 0 ? (
          <p className="mt-3 text-sm text-[#74829f]">No steps recorded yet.</p>
        ) : (
          <ol className="relative mt-4 space-y-3 before:absolute before:bottom-4 before:left-[1.4rem] before:top-4 before:w-px before:bg-[#12306a]">
            {tasks.map((task, idx) => {
              const open = expandedTask === idx;
              return (
                <li key={task.id} className="relative">
                  <div className={`${panelClass} ml-0 transition-colors ${open ? 'border-[#1478fd]/60' : ''}`}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpandedTask(open ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#12306a] bg-[#061230] font-mono text-xs font-semibold text-[#41cbfd]">
                          {task.step_order}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#eef2fc]">{task.title}</p>
                          {task.description && <p className="mt-0.5 text-xs text-[#9aa8c7]">{task.description}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />}
                        {task.status === 'failed' && <XCircle className="h-4 w-4 text-[#ef4444]" />}
                        {task.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-[#41cbfd]" />}
                        {task.status === 'pending' && <Clock className="h-4 w-4 text-[#74829f]" />}
                        <ChevronDown className={`h-4 w-4 text-[#74829f] transition-transform ${open ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {open && task.response && (
                      <div className="space-y-4 border-t border-[#12306a] px-4 pb-5 pt-4 sm:px-5">
                        {task.prompt && (
                          <div>
                            <span className="rounded border border-[#12306a] bg-[#061230] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-[#9aa8c7]">Prompt</span>
                            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-[#12306a] bg-[#061230] p-3 text-xs leading-relaxed text-[#9aa8c7]">
                              {task.prompt.slice(0, 500)}{task.prompt.length > 500 ? '…' : ''}
                            </pre>
                          </div>
                        )}
                        <div>
                          <span className="rounded border border-[#41cbfd]/30 bg-[#1478fd]/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-[#a3ecff]">LLM response</span>
                          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-[#12306a] bg-[#000610] p-4 font-mono text-xs leading-relaxed text-[#a3ecff]">
                            {typeof task.response === 'string' ? task.response : JSON.stringify(task.response, null, 2)}
                          </pre>
                        </div>
                        {task.error_message && (
                          <p className="flex items-center gap-1.5 text-xs text-[#fca5a5]"><AlertCircle className="h-3.5 w-3.5" />{task.error_message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
