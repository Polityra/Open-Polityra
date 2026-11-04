'use client';

import { useState, useEffect } from 'react';
import { api, type AiWorkflowType } from '@open-polityra/api-client';
import { Sparkles, Loader2, AlertCircle, Check } from 'lucide-react';
import { WORKFLOW_TYPES, inputClass, labelClass, panelClass } from './workflow-config';

interface WorkflowFormProps {
  onSubmit: (result: { workflowId: string }) => void;
}

export default function WorkflowForm({ onSubmit }: WorkflowFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AiWorkflowType>('economic-analysis');
  const [context, setContext] = useState('');
  const [data, setData] = useState('');
  const [model, setModel] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ollama status
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'ok' | 'unavailable'>('checking');

  useEffect(() => {
    api.aiHealth().then(
      (res) => setOllamaStatus(res.available ? 'ok' : 'unavailable'),
      () => setOllamaStatus('unavailable'),
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
        model: model.trim() || undefined,
        systemPrompt: undefined,
        parameters: {
          context: context.trim(),
          data: data.trim(),
          ...(type === 'custom' ? { custom_prompt: customPrompt.trim() } : {}),
        },
      });

      onSubmit({ workflowId: result.workflow.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('unavailable') || msg.includes('Ollama')) {
        setError('Ollama service is unavailable. Please start Ollama and pull the qwen3:0.6b model.');
      } else {
        setError(`Failed to create workflow: ${msg}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const statusStyle =
    ollamaStatus === 'ok'
      ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#86efac]'
      : ollamaStatus === 'checking'
      ? 'border-[#74829f]/30 bg-[#74829f]/10 text-[#c4cfe6]'
      : 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fca5a5]';
  const dotStyle =
    ollamaStatus === 'ok' ? 'bg-[#22c55e] animate-pulse' : ollamaStatus === 'checking' ? 'bg-[#74829f]' : 'bg-[#ef4444]';

  return (
    <div className={`${panelClass} p-6`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-white">New AI analysis</h2>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyle}`}>
          <span className={`h-2 w-2 rounded-full ${dotStyle}`} />
          {ollamaStatus === 'ok' ? 'Ollama ready' : ollamaStatus === 'checking' ? 'Checking…' : 'Ollama offline'}
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
                      ? 'border-[#1478fd] bg-[#1478fd]/15 shadow-[0_0_20px_rgba(20,120,253,0.2)]'
                      : 'border-[#12306a] bg-[#061230] hover:border-[#324c80]'
                  }`}
                >
                  {active && <Check className="absolute right-3 top-3 h-4 w-4 text-[#41cbfd]" />}
                  <span className={`inline-flex rounded-md p-2 ${active ? 'bg-[#1478fd]/25 text-[#a3ecff]' : 'bg-[#12306a]/60 text-[#41cbfd]'}`}>
                    <t.icon className="h-5 w-5" />
                  </span>
                  <p className={`mt-3 text-sm font-semibold ${active ? 'text-white' : 'text-[#eef2fc]'}`}>{t.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#9aa8c7]">{t.description}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Title */}
        <div>
          <label htmlFor="wf-title" className={labelClass}>Title</label>
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
          <label htmlFor="wf-context" className={labelClass}>Context / input</label>
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
        {type === 'custom' && (
          <div>
            <label htmlFor="wf-custom" className={labelClass}>Custom prompt</label>
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
            Additional data <span className="font-normal text-[#74829f]">(optional)</span>
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

        {/* Model selector */}
        <div>
          <label htmlFor="wf-model" className={labelClass}>
            Model <span className="font-normal text-[#74829f]">(optional)</span>
          </label>
          <input
            id="wf-model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="qwen3:0.6b"
            className={`${inputClass} font-mono`}
          />
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#fca5a5]" />
            <p className="text-sm text-[#fca5a5]">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isRunning || !title.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1478fd] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0b5fd9] hover:shadow-[0_0_24px_rgba(20,120,253,0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
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
