/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { api, type ClaimStatus, type IntelligenceClaim } from "@open-polityra/api-client";
import {
  Badge,
  EmptyState,
  ErrorNote,
  LoadingBlock,
  PageHeader,
  btnPrimary,
  chip,
  inputClass,
  panel,
  sectionTitle,
} from "@/components/dashboard/kit";

const REVIEW_STATUSES: ClaimStatus[] = [
  "unverified",
  "under_review",
  "disputed",
  "insufficient_evidence",
];
const DECISIONS: { value: ClaimStatus; label: string }[] = [
  { value: "under_review", label: "Keep under review" },
  { value: "supported", label: "Supported" },
  { value: "corroborated", label: "Corroborated" },
  { value: "contradicted", label: "Contradicted" },
  { value: "disputed", label: "Disputed" },
  { value: "insufficient_evidence", label: "Insufficient evidence" },
];

export default function ReviewQueue() {
  const [claims, setClaims] = useState<IntelligenceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ClaimStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [decision, setDecision] = useState<ClaimStatus>("under_review");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.intelligence.listClaims({
        limit: 200,
        status: status === "all" ? undefined : status,
      });
      const filtered =
        status === "all"
          ? result.claims.filter((claim) => REVIEW_STATUSES.includes(claim.status))
          : result.claims;
      setClaims(filtered);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the review queue.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(claimId: string) {
    setSaving(true);
    setError(null);
    try {
      await api.intelligence.review(claimId, { status: decision, note: note.trim() });
      setSelected(null);
      setNote("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Human"
        accent="Review"
        description="Review extracted claims against their source spans and evidence. A review is an audit record, not an AI confidence score."
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(status === "all")} onClick={() => setStatus("all")}>
          Review queue
        </button>
        {REVIEW_STATUSES.map((item) => (
          <button
            key={item}
            type="button"
            className={`${chip(status === item)} capitalize`}
            onClick={() => setStatus(item)}
          >
            {item.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <div className={panel}>
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className={sectionTitle}>{claims.length} claims awaiting attention</h2>
        </div>
        {loading ? (
          <LoadingBlock label="Loading review queue…" />
        ) : claims.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Review queue is clear"
            text="New extracted claims needing review will appear here."
          />
        ) : (
          <ul className="divide-y divide-neutral-200">
            {claims.map((claim) => (
              <li key={claim.id} className="p-5">
                <div className="flex items-start gap-4">
                  <span className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-950">
                        {claim.document_title ?? "Untitled document"}
                      </p>
                      <Badge tone={claim.status === "disputed" ? "warning" : "neutral"}>
                        {claim.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-neutral-700">{claim.claim_text}</p>
                    <p className="mt-2 font-mono text-xs text-neutral-500">
                      Span {claim.source_start}:{claim.source_end} · {claim.extraction_model}
                    </p>
                    {claim.evidence && claim.evidence.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {claim.evidence.slice(0, 3).map((evidence) => (
                          <li
                            key={evidence.id}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600"
                          >
                            <strong className="capitalize">{evidence.stance}</strong> ·{" "}
                            {evidence.quote.slice(0, 240)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={btnPrimary}
                        onClick={() => {
                          setSelected(selected === claim.id ? null : claim.id);
                          setDecision("under_review");
                        }}
                      >
                        Review claim
                      </button>
                      <Link
                        href={`/dashboard/claims/${claim.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-700 underline"
                      >
                        Open provenance
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {selected === claim.id && (
                      <form
                        className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void submit(claim.id);
                        }}
                      >
                        <label className="block text-sm font-medium text-neutral-700">
                          Decision
                          <select
                            className={`${inputClass} mt-1.5`}
                            value={decision}
                            onChange={(event) => setDecision(event.target.value as ClaimStatus)}
                          >
                            {DECISIONS.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-neutral-700">
                          Review note
                          <textarea
                            required
                            minLength={3}
                            maxLength={4000}
                            rows={3}
                            className={`${inputClass} mt-1.5`}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Explain which evidence supports this decision and what remains uncertain."
                          />
                        </label>
                        <button type="submit" className={btnPrimary} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                          Save review
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
