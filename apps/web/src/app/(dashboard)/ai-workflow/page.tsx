"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Cpu,
  ShieldCheck,
  Database,
  Download,
  Package,
  Play,
  Terminal,
} from "lucide-react";
import WorkflowForm from "./components/WorkflowForm";
import WorkflowList from "./components/WorkflowList";
import WorkflowDetail from "./components/WorkflowDetail";
import { panelClass } from "./components/workflow-config";

const highlights = [
  {
    icon: Cpu,
    title: "Local Ollama model",
    text: "Analysis runs locally with the configured olmo-3:7b model.",
  },
  {
    icon: ShieldCheck,
    title: "Choose your privacy level",
    text: "Prompts are sent only to your configured local Ollama instance.",
  },
  {
    icon: Database,
    title: "Saved results",
    text: "Every analysis is stored in the database for later review.",
  },
];

const setupSteps = [
  {
    icon: Download,
    title: "Install Ollama",
    body: (
      <>
        Install Ollama from <code>ollama.com</code>.
      </>
    ),
  },
  {
    icon: Package,
    title: "Pull the required model",
    body: (
      <>
        Run <code>ollama pull olmo-3:7b</code>.
      </>
    ),
  },
  {
    icon: Play,
    title: "Start local Ollama",
    body: (
      <>
        Run <code>ollama serve</code> and configure <code>OLLAMA_BASE_URL</code>.
      </>
    ),
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
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight text-neutral-950">
            AI <strong className="font-semibold">Workflows</strong>
          </h1>
          <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-neutral-400 to-neutral-950" />
          <p className="mt-3 max-w-2xl text-sm text-neutral-600">
            Run AI analysis with the configured local olmo-3:7b model. Results are saved to the
            database for later review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
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

      {/* Workflow creation form */}
      {showForm && (
        <WorkflowForm
          onSubmit={(result) => {
            setSelectedWorkflow(result.workflowId);
            setShowForm(false);
          }}
        />
      )}

      {/* How it works */}
      {!showForm && (
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.title}
              className={`${panelClass} p-5 transition-colors hover:border-black/40`}
            >
              <span className="inline-flex rounded-lg border border-black/10 bg-neutral-100 p-2.5 text-neutral-700">
                <h.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-neutral-950">
                {h.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{h.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Workflow list */}
      <WorkflowList onSelectWorkflow={setSelectedWorkflow} />

      {/* Setup instructions */}
      {!showForm && (
        <div className={`${panelClass} p-6`}>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-neutral-700" />
            <h3 className="font-display text-base font-semibold text-neutral-950">Setup guide</h3>
          </div>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {setupSteps.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-black/10 bg-neutral-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-md border border-black/10 bg-neutral-100 p-1.5 text-neutral-700">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-xs text-neutral-500">0{i + 1}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-neutral-950">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600 [&_code]:rounded [&_code]:bg-neutral-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-neutral-800">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
