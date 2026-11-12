"use client";

import { useState, useEffect } from "react";
import { api, type AiWorkflowType } from "@open-polityra/api-client";
import { Sparkles, Loader2, AlertCircle, Check } from "lucide-react";
import { WORKFLOW_TYPES, inputClass, labelClass, panelClass } from "./workflow-config";

interface WorkflowFormProps {
  onSubmit: (result: { workflowId: string }) => void;
}

export default function WorkflowForm({ onSubmit }: WorkflowFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AiWorkflowType>("economic-analysis");
  const [context, setContext] = useState("");
  const [data, setData] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ollama status
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "ok" | "unavailable">("checking");
  useEffect(() => {
    api.aiHealth().then(
      (res) => {
        setOllamaStatus(res.available ? "ok" : "unavailable");
      },
      () => {
        setOllamaStatus("unavailable");
      },
    );
  }, []);

  const selectedType = WORKFLOW_TYPES.find((t) => t.value === type)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);

    try {
      const result = await api.aiWorkflows.create({
        title: title.trim(),
        description: context.trim() || undefined,
        type,
        systemPrompt: undefined,
        parameters: {
          context: context.trim(),
          data: data.trim(),
          ...(type === "custom" ? { custom_prompt: customPrompt.trim() } : {}),
        },
      });

      onSubmit({ workflowId: result.workflow.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("unavailable") || msg.includes("Ollama")) {
        setError(
          "Local Ollama model olmo-3:7b is unavailable. Start Ollama and pull it with `ollama pull olmo-3:7b`.",
        );
      } else {
        setError(`Failed to create workflow: ${msg}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const statusStyle =
    ollamaStatus === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : ollamaStatus === "checking"
        ? "border-black/10 bg-neutral-100 text-neutral-700"
        : "border-red-300 bg-red-50 text-red-700";
  const dotStyle =
    ollamaStatus === "ok"
      ? "bg-[#22c55e] animate-pulse"
      : ollamaStatus === "checking"
        ? "bg-neutral-400"
        : "bg-[#ef4444]";

  return (
    <div className={`${panelClass} p-6`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-neutral-950">New AI analysis</h2>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyle}`}
        >
          <span className={`h-2 w-2 rounded-full ${dotStyle}`} />
          {ollamaStatus === "ok"
            ? "Local olmo-3:7b ready"
            : ollamaStatus === "checking"
              ? "Checking…"
              : "No model available"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Workflow type selector */}
        <fieldset>
          <legend className={labelClass}>Analysis type</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW_TYPES.map((t) => {
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(t.value)}
                  className={`relative rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-neutral-950 bg-neutral-100 shadow-sm"
                      : "border-black/10 bg-neutral-50 hover:border-black/30"
                  }`}
                >
                  {active && <Check className="absolute right-3 top-3 h-4 w-4 text-neutral-950" />}
                  <span
                    className={`inline-flex rounded-md p-2 ${active ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-900"}`}
                  >
                    <t.icon className="h-5 w-5" />
                  </span>
                  <p
                    className={`mt-3 text-sm font-semibold ${active ? "text-neutral-950" : "text-neutral-950"}`}
                  >
                    {t.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">{t.description}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Title */}
        <div>
          <label htmlFor="wf-title" className={labelClass}>
            Title
          </label>
          <input
            id="wf-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this analysis a name…"
            className={inputClass}
            required
          />
        </div>

        {/* Context / Input */}
        <div>
          <label htmlFor="wf-context" className={labelClass}>
            Context / input
          </label>
          <textarea
            id="wf-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe the situation, question, or data to analyze…"
            rows={4}
            className={inputClass}
          />
        </div>

        {/* Custom prompt */}
        {type === "custom" && (
          <div>
            <label htmlFor="wf-custom" className={labelClass}>
              Custom prompt
            </label>
            <textarea
              id="wf-custom"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Write the instructions the model should follow…"
              rows={4}
              className={`${inputClass} font-mono`}
            />
          </div>
        )}

        {/* Additional data */}
        <div>
          <label htmlFor="wf-data" className={labelClass}>
            Additional data <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <textarea
            id="wf-data"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Paste structured data, tables, or supplementary information…"
            rows={3}
            className={inputClass}
          />
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isRunning || !title.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-neutral-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running analysis…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Run {selectedType.label}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
