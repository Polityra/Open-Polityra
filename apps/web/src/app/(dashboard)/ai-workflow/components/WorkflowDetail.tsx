"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type AiWorkflowRow, type WorkflowTaskRow } from "@open-polityra/api-client";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import AiMarkdown from "@/components/common/AiMarkdown";
import StatusBadge from "./StatusBadge";
import { TYPE_CONFIG, panelClass, inputClass, labelClass } from "./workflow-config";

interface EvidenceItem {
  id: string;
  label: string;
  text: string;
  source?: { publisher: string; url?: string; license?: string; retrieved_at?: string };
}
interface Verification {
  status: "passed" | "flagged";
  failures: string[];
  warnings: string[];
  statements_total: number;
  statements_cited: number;
}
interface Review {
  status: "pending" | "approved" | "rejected";
  decided_at: string | null;
  note: string | null;
}
interface EvidenceResult {
  schema_version: 2;
  question: string;
  summary: string;
  evidence: EvidenceItem[];
  verification: Verification;
  evidence_coverage: { ratio: number; level: "high" | "medium" | "low" };
  methodology: string[];
  uncertainty: string[];
  limitations: string[];
  review: Review;
  generated_by: { model: string; provider: string };
  generated_at: string;
}

const isEvidenceResult = (r: unknown): r is EvidenceResult => {
  if (!r || typeof r !== "object") return false;
  const x = r as Partial<EvidenceResult>;
  return (
    x.schema_version === 2 &&
    typeof x.summary === "string" &&
    Array.isArray(x.evidence) &&
    !!x.verification &&
    !!x.evidence_coverage &&
    !!x.review &&
    !!x.generated_by &&
    Array.isArray(x.methodology) &&
    Array.isArray(x.uncertainty) &&
    Array.isArray(x.limitations)
  );
};

const ANALYSIS_DISCLAIMER =
  "AI-generated explanation of the listed evidence. It is not a forecast, recommendation or verified finding until a person approves it.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${panelClass} p-6`}>
      <h2 className="font-display text-lg font-semibold text-neutral-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-neutral-500">None.</p>;
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

const coverageColor = {
  high: "border-emerald-300 bg-emerald-50 text-emerald-700",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  low: "border-red-300 bg-red-50 text-red-700",
};

interface WorkflowDetailProps {
  workflowId: string;
  onBack: () => void;
}

export default function WorkflowDetail({ workflowId, onBack }: WorkflowDetailProps) {
  const [workflow, setWorkflow] = useState<AiWorkflowRow | null>(null);
  const [tasks, setTasks] = useState<WorkflowTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.aiWorkflows.byId(workflowId);
      setWorkflow(res.workflow);
      setTasks(res.tasks ?? []);
      return res.workflow;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    let cancelled = false;
    api.aiWorkflows
      .byId(workflowId)
      .then((res) => {
        if (cancelled) return;
        setWorkflow(res.workflow);
        setTasks(res.tasks ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  const active = workflow?.status === "running" || workflow?.status === "pending";
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [active, load]);

  async function decide(decision: "approved" | "rejected") {
    setReviewError(null);
    setReviewing(true);
    try {
      await api.aiWorkflows.review(workflowId, { decision, note: note.trim() || undefined });
      await load();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "The review could not be saved.");
    } finally {
      setReviewing(false);
    }
  }

  const back = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition hover:text-neutral-950"
    >
      <ArrowLeft className="h-4 w-4" /> Back to analyses
    </button>
  );

  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-700" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="space-y-6">
        {back}
        <div className={`${panelClass} flex items-center gap-2 p-6 text-sm text-neutral-700`}>
          <AlertCircle className="h-4 w-4" /> This analysis could not be found.
        </div>
      </div>
    );
  }

  const typeCfg = TYPE_CONFIG[workflow.type];
  const result = isEvidenceResult(workflow.result) ? workflow.result : null;
  const legacyText =
    !result &&
    workflow.result &&
    typeof (workflow.result as { summary?: unknown }).summary === "string"
      ? (workflow.result as { summary: string }).summary
      : null;

  const reviewBanner =
    result &&
    {
      pending: {
        cls: "border-amber-300 bg-amber-50 text-amber-800",
        text: "Unreviewed AI draft — not verified by a person.",
      },
      approved: {
        cls: "border-emerald-300 bg-emerald-50 text-emerald-800",
        text: "Approved by a human reviewer.",
      },
      rejected: {
        cls: "border-red-300 bg-red-50 text-red-800",
        text: "Rejected by a human reviewer.",
      },
    }[result.review.status];

  return (
    <div className="space-y-6">
      {back}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
            {workflow.title}
          </h1>
          <StatusBadge status={workflow.status} />
        </div>
        <p className="text-sm text-neutral-600">
          {typeCfg?.label ?? workflow.type} · created{" "}
          {new Date(workflow.created_at).toLocaleString()}
        </p>
      </header>

      {/* Pipeline */}
      <Section title="Pipeline">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tasks.map((t) => (
            <li key={t.id} className="rounded-lg border border-black/10 bg-neutral-50 p-4">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="font-mono">Step {t.step_order}</span>
                {t.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {t.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                {t.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <p className="mt-2 text-sm font-semibold text-neutral-950">{t.title}</p>
              <p className="mt-1 text-xs text-neutral-600">{t.description}</p>
            </li>
          ))}
        </ol>
        {tasks.length === 0 && <p className="text-sm text-neutral-500">No steps recorded.</p>}
      </Section>

      {workflow.status === "failed" && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {workflow.error_message ?? "The analysis failed."}
        </div>
      )}

      {/* Legacy analyses */}
      {!result && workflow.status === "completed" && (
        <Section title="Legacy output">
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            This analysis predates evidence-grounded workflows. It has no citations or verification
            and must not be treated as a sourced finding.
          </div>
          {legacyText ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
              {legacyText}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">No readable output stored.</p>
          )}
        </Section>
      )}

      {result && reviewBanner && (
        <>
          <div
            className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${reviewBanner.cls}`}
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{reviewBanner.text}</p>
              <p className="mt-0.5 opacity-90">{ANALYSIS_DISCLAIMER}</p>
            </div>
          </div>

          <Section title="Question">
            <p className="text-sm text-neutral-700">{result.question}</p>
          </Section>

          <Section title="AI explanation draft">
            <AiMarkdown text={result.summary} citations />
            <p className="mt-4 text-xs text-neutral-500">
              Generated by {result.generated_by.model} ({result.generated_by.provider}) on{" "}
              {new Date(result.generated_at).toLocaleString()}
            </p>
          </Section>

          <Section title="Evidence">
            <ol className="space-y-3">
              {result.evidence.map((e) => (
                <li
                  key={e.id}
                  id={`evidence-${e.id}`}
                  className="scroll-mt-24 rounded-lg border border-black/10 bg-neutral-50 p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="rounded border border-black/10 bg-white px-1.5 font-mono text-xs text-neutral-800">
                      {e.id}
                    </span>
                    <span className="text-sm font-semibold text-neutral-950">{e.label}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">{e.text}</p>
                  {e.source && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-neutral-500">
                      <span>{e.source.publisher}</span>
                      {e.source.license && <span>Licence: {e.source.license}</span>}
                      {e.source.retrieved_at && <span>Retrieved {e.source.retrieved_at}</span>}
                      {e.source.url && (
                        <a
                          href={e.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-neutral-700 underline"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Verification">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  result.verification.status === "passed"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {result.verification.status === "passed" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {result.verification.status === "passed" ? "Mechanical checks passed" : "Flagged"}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${coverageColor[result.evidence_coverage.level]}`}
                title="Share of statements that cite evidence. It does not measure whether they are correct."
              >
                Evidence coverage: {Math.round(result.evidence_coverage.ratio * 100)}% (
                {result.evidence_coverage.level})
              </span>
              <span className="text-xs text-neutral-500">
                {result.verification.statements_cited} of {result.verification.statements_total}{" "}
                statements cite evidence
              </span>
            </div>
            {result.verification.failures.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-1.5 text-sm font-semibold text-red-700">Failures</h3>
                <List items={result.verification.failures} />
              </div>
            )}
            {result.verification.warnings.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-1.5 text-sm font-semibold text-amber-700">Warnings</h3>
                <List items={result.verification.warnings} />
              </div>
            )}
          </Section>

          <div className="grid gap-6 lg:grid-cols-3">
            <Section title="Methodology">
              <List items={result.methodology} />
            </Section>
            <Section title="Uncertainty">
              <List items={result.uncertainty} />
            </Section>
            <Section title="Limitations">
              <List items={result.limitations} />
            </Section>
          </div>

          <Section title="Human review">
            {result.review.status === "pending" ? (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Check each claim against the cited evidence before deciding.
                  {result.verification.status !== "passed" &&
                    " Flagged drafts can only be rejected."}
                </p>
                <div>
                  <label htmlFor="review-note" className={labelClass}>
                    Note (optional)
                  </label>
                  <textarea
                    id="review-note"
                    rows={3}
                    maxLength={1000}
                    className={inputClass}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                {reviewError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {reviewError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={reviewing || result.verification.status !== "passed"}
                    onClick={() => decide("approved")}
                    className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={reviewing}
                    onClick={() => decide("rejected")}
                    className="rounded-lg border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-700">
                <p>
                  <strong className="capitalize">{result.review.status}</strong>
                  {result.review.decided_at &&
                    ` on ${new Date(result.review.decided_at).toLocaleString()}`}
                </p>
                {result.review.note && (
                  <p className="mt-2 text-neutral-600">“{result.review.note}”</p>
                )}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
