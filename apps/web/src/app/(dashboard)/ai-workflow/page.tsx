'use client';

import { useState } from 'react';
import { Plus, X, Cpu, ShieldCheck, Database, Download, Package, Play, ToggleRight, Terminal } from 'lucide-react';
import WorkflowForm from './components/WorkflowForm';
import WorkflowList from './components/WorkflowList';
import WorkflowDetail from './components/WorkflowDetail';
import { panelClass } from './components/workflow-config';

const highlights = [
  { icon: Cpu, title: 'Local models', text: 'Runs on your own Ollama instance with Qwen3:0.6b.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'No external APIs or cloud services touch your data.' },
  { icon: Database, title: 'Saved results', text: 'Every analysis is stored in the database for later review.' },
];

const setupSteps = [
  { icon: Download, title: 'Install Ollama', body: <>Visit <code>ollama.ai</code> and install it for your platform.</> },
  { icon: Package, title: 'Pull the model', body: <>Run <code>ollama pull qwen3:0.6b</code></> },
  { icon: Play, title: 'Start Ollama', body: <>Run <code>ollama serve</code></> },
  { icon: ToggleRight, title: 'Enable in .env', body: <>Set <code>AI_WORKFLOW_ENABLED=true</code></> },
];

export default function AiWorkflowPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (selectedWorkflow) {
    return <WorkflowDetail workflowId={selectedWorkflow} onBack={() => setSelectedWorkflow(null)} />;
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight text-white">
            AI <strong className="font-semibold">Workflows</strong>
          </h1>
          <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-[#32b2f7] to-[#3468f5]" />
          <p className="mt-3 max-w-2xl text-sm text-[#9aa8c7]">
            Run Ollama-powered AI analysis using Qwen3:0.6b. Results are saved to the database for later review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1478fd] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0b5fd9] hover:shadow-[0_0_24px_rgba(20,120,253,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#41cbfd]"
        >
          {showForm ? <><X className="h-4 w-4" /> Close form</> : <><Plus className="h-4 w-4" /> New analysis</>}
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
            <div key={h.title} className={`${panelClass} p-5 transition-colors hover:border-[#1478fd]`}>
              <span className="inline-flex rounded-lg bg-[#1478fd]/15 p-2.5 text-[#41cbfd]">
                <h.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-white">{h.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#9aa8c7]">{h.text}</p>
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
            <Terminal className="h-4 w-4 text-[#41cbfd]" />
            <h3 className="font-display text-base font-semibold text-white">Setup guide</h3>
          </div>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {setupSteps.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-[#12306a] bg-[#061230] p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-md bg-[#1478fd]/15 p-1.5 text-[#41cbfd]">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-xs text-[#74829f]">0{i + 1}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#eef2fc]">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#9aa8c7] [&_code]:rounded [&_code]:bg-[#12306a]/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[#a3ecff]">
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
