/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { FileText, Calendar, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api, type ReportRow } from "@open-polityra/api-client";
import {
  PageHeader,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  Badge,
  panel,
  chip,
  btnPrimary,
  btnGhost,
  inputClass,
  pick,
  pickTotal,
  fmtDate,
  type Tone,
} from "@/components/dashboard/kit";

const PAGE = 20;
const STATUSES = ["published", "reviewing", "draft"];
const TONE: Record<string, Tone> = { published: "success", reviewing: "warning", draft: "neutral" };

export default function ReportsClient() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.reports.list({
          limit: PAGE,
          offset: (page - 1) * PAGE,
          status: status || undefined,
        });
        if (cancelled) return;
        const rows = pick<ReportRow>(res, "reports");
        setReports(rows);
        setTotal(pickTotal(res, (page - 1) * PAGE + rows.length));
        setError(false);
      } catch {
        if (!cancelled) {
          setReports([]);
          setTotal(0);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, page, refreshKey]);

  const pages = Math.max(1, Math.ceil(total / PAGE));

  async function createReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.reports.create({ title: title.trim(), content: { body: content.trim() } });
      setTitle("");
      setContent("");
      setPage(1);
      setStatus("");
      setShowForm(false);
      setRefreshKey((key) => key + 1);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not create the report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Research"
        accent="Reports"
        description="Published and draft research reports. All analysis follows peer review standards."
        action={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className={btnPrimary}
          >
            <Plus className="h-4 w-4" /> {showForm ? "Close form" : "New report"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={createReport} className={`${panel} space-y-4 p-6`}>
          <h2 className="font-display text-lg font-semibold text-neutral-950">Create a draft</h2>
          <label className="block text-sm font-medium text-neutral-700">
            Report title
            <input
              required
              minLength={2}
              maxLength={512}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Report content
            <textarea
              rows={7}
              maxLength={30_000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Write the findings, evidence and limitations for this draft."
            />
          </label>
          {formError && <ErrorNote>{formError}</ErrorNote>}
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save draft"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={chip(!status)}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            className={`${chip(status === s)} capitalize`}
            onClick={() => {
              setStatus(status === s ? "" : s);
              setPage(1);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={panel}>
        {loading ? (
          <LoadingBlock label="Loading reports…" />
        ) : error ? (
          <div className="p-6">
            <ErrorNote>Failed to load reports from the backend.</ErrorNote>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={status ? "No reports match this filter" : "No reports yet"}
            text={
              status ? "Try another status." : "Reports stored in the database will appear here."
            }
          />
        ) : (
          <ul className="divide-y divide-black/[0.08]">
            {reports.map((r) => (
              <li key={r.id} className="px-6 py-4 transition-colors hover:bg-black/[0.03]">
                <button
                  type="button"
                  className="flex w-full items-center gap-4 text-left"
                  aria-expanded={expanded === r.id}
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <span className="rounded-lg border border-black/10 bg-neutral-100 p-2.5 text-neutral-900">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-950">
                      {r.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
                      <span className="font-mono">{r.id.slice(0, 8)}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(r.created_at)}
                      </span>
                    </span>
                  </span>
                  <Badge tone={TONE[r.status] ?? "neutral"}>
                    <span className="capitalize">{r.status}</span>
                  </Badge>
                </button>
                {expanded === r.id && (
                  <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
                    {typeof r.content?.body === "string"
                      ? r.content.body
                      : JSON.stringify(r.content ?? {}, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
            <p className="text-sm text-neutral-500">
              Showing {reports.length} of {total} reports
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={btnGhost}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs text-neutral-600">
                {page} / {pages}
              </span>
              <button
                type="button"
                className={btnGhost}
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
