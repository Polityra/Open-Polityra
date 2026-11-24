"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Quote } from "lucide-react";
import { api, type IntelligenceClaim } from "@open-polityra/api-client";
import {
  Badge,
  EmptyState,
  ErrorNote,
  LoadingBlock,
  PageHeader,
  btnGhost,
  panel,
  sectionTitle,
} from "@/components/dashboard/kit";

export default function ClaimDetail({ id }: { id: string }) {
  const [claim, setClaim] = useState<IntelligenceClaim | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.intelligence.claim(id).then(
      (result) => setClaim(result.claim),
      (cause) => setError(cause instanceof Error ? cause.message : "Could not load claim."),
    );
  }, [id]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!claim) return <LoadingBlock label="Loading claim provenance…" />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Claim"
        accent="Provenance"
        description="The claim, original source span, linked evidence and full verification history."
        action={
          <Link href="/dashboard/reviews" className={btnGhost}>
            <ArrowLeft className="h-4 w-4" />
            Back to reviews
          </Link>
        }
      />
      <section className={`${panel} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}>{claim.document_title ?? "Extracted claim"}</h2>
          <Badge>{claim.status.replaceAll("_", " ")}</Badge>
        </div>
        <blockquote className="mt-5 border-l-2 border-neutral-900 pl-4 text-lg leading-8 text-neutral-900">
          {claim.claim_text}
        </blockquote>
        <p className="mt-3 font-mono text-xs text-neutral-500">
          offsets {claim.source_start}:{claim.source_end} · {claim.extraction_model}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panel}>
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className={sectionTitle}>Linked evidence</h2>
          </div>
          {!claim.evidence?.length ? (
            <EmptyState
              icon={Quote}
              title="No linked evidence"
              text="This claim is not yet supported or contradicted by another stored document."
            />
          ) : (
            <ul className="divide-y divide-neutral-200">
              {claim.evidence.map((item) => (
                <li key={item.id} className="px-6 py-4">
                  <Badge tone={item.stance === "supports" ? "success" : "warning"}>
                    {item.stance}
                  </Badge>
                  <p className="mt-2 text-sm text-neutral-700">{item.quote}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    relevance {Math.round(item.relevance * 100)}% · source span {item.source_start}:
                    {item.source_end}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={panel}>
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className={sectionTitle}>Verification history</h2>
          </div>
          {!claim.verification_history?.length ? (
            <EmptyState
              icon={Quote}
              title="No verification decisions"
              text="Automatic and human decisions will be preserved here."
            />
          ) : (
            <ul className="divide-y divide-neutral-200">
              {claim.verification_history.map((item) => (
                <li key={item.id} className="px-6 py-4">
                  <Badge>{item.status.replaceAll("_", " ")}</Badge>
                  <p className="mt-2 text-sm text-neutral-700">{item.reasoning}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
