"use client";

import { useState } from "react";
import { Plus, X, Database, FileCheck2, UserCheck, Ban } from "lucide-react";
import WorkflowForm from "./components/WorkflowForm";
import WorkflowList from "./components/WorkflowList";
import WorkflowDetail from "./components/WorkflowDetail";
import { panelClass } from "./components/workflow-config";

const principles = [
  {
    icon: Database,
    title: "Evidence first",
    text: "Every analysis starts from numbered, sourced evidence items with licence and retrieval details.",
  },
  {
    icon: FileCheck2,
    title: "Checked citations",
    text: "The AI draft must cite evidence ids. Citations, numbers and advisory wording are checked mechanically.",
  },
  {
    icon: UserCheck,
    title: "Human review",
    text: "Nothing counts as verified until a person approves it. Flagged drafts can only be rejected.",
  },
  {
    icon: Ban,
    title: "No recommendations",
    text: "Output explains evidence and scenarios. It does not forecast or tell anyone what to do.",
  },
];

export default function AiWorkflowPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (selectedWorkflow) {
    return (
      <WorkflowDetail workflowId={selectedWorkflow} onBack={() => setSelectedWorkflow(null)} />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight text-neutral-950">
            Evidence <strong className="font-semibold">Analyses</strong>
          </h1>
          <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-neutral-400 to-neutral-950" />
          <p className="mt-3 max-w-2xl text-sm text-neutral-600">
            Source-grounded explanations produced by a local model: evidence pack, deterministic
            statistics, AI draft, verification, then human review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" /> Close form
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> New analysis
            </>
          )}
        </button>
      </div>

      {showForm && (
        <WorkflowForm
          onSubmit={(result) => {
            setSelectedWorkflow(result.workflowId);
            setShowForm(false);
          }}
        />
      )}

      {!showForm && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p) => (
            <div key={p.title} className={`${panelClass} p-5`}>
              <span className="inline-flex rounded-lg border border-black/10 bg-neutral-100 p-2.5 text-neutral-700">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-neutral-950">
                {p.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{p.text}</p>
            </div>
          ))}
        </div>
      )}

      <WorkflowList onSelectWorkflow={setSelectedWorkflow} />
    </div>
  );
}
