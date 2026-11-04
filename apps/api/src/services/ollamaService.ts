import { getEnv } from '../config/env';
import type { Env } from '../config/env';
import { AppError } from '../errors/appError';

let cachedEnv: Env | null = null;

function _getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = getEnv();
  return cachedEnv;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaGenerateOptions {
  model?: string;
  system?: string;
  stream?: boolean;
  format?: 'json' | 'text';
  template?: string;
}

export interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  created_at: string;
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaModelInfo {
  name: string;
  model: string;
  size: number;
  digest: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaListModelsResponse {
  models: OllamaModelInfo[];
}

/**
 * Check if Ollama is reachable and the required model is available.
 */
export async function checkOllamaStatus(): Promise<{
  available: boolean;
  models: string[];
  modelAvailable: boolean;
}> {
  try {
    const cfg = _getEnv();
    const res = await fetch(`${cfg.OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false, models: [], modelAvailable: false };

    const body: OllamaListModelsResponse = await res.json();
    const modelTag = cfg.AI_MODEL;
    const found = body.models.some((m) => m.model.startsWith(modelTag) || m.name === modelTag);

    return { available: true, models: body.models.map((m) => m.model), modelAvailable: !!found };
  } catch {
    return { available: false, models: [], modelAvailable: false };
  }
}

/**
 * Generate text using Ollama's chat endpoint with JSON mode support.
 */
export async function generateChat(
  messages: OllamaChatMessage[],
  options: OllamaGenerateOptions = {},
): Promise<{ content: string; model: string; durationMs: number }> {
  const cfg = _getEnv();
  const { model = cfg.AI_MODEL, system, format = 'text' } = options;

  const ollamaMessages = messages.filter((m) => m.content.trim());

  const body: Record<string, unknown> = {
    model,
    messages: system
      ? [
        { role: 'system' as const, content: system },
        ...ollamaMessages.map((m) => ({ role: m.role as string, content: m.content })),
      ]
      : ollamaMessages.map((m) => ({ role: m.role as string, content: m.content })),
    format: format === 'json' ? 'json' : undefined,
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 2048,
      top_p: 0.9,
    },
  };

  const res = await fetch(`${cfg.OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new AppError(res.status, 'ollama_error', `Ollama chat error (${res.status}): ${bodyText || 'Unknown error'}`);
  }

  const raw: OllamaChatResponse = await res.json();

  if (!raw.message?.content) {
    throw new AppError(502, 'ollama_empty_response', 'Ollama returned an empty response');
  }

  // Try to parse and re-format JSON responses for consistency
  let content = raw.message.content;
  if (format === 'json') {
    try {
      const parsed = JSON.parse(content);
      content = JSON.stringify(parsed, null, 2);
    } catch {
      // Not valid JSON — keep as-is (model may have returned prose)
    }
  }

  return {
    content,
    model: raw.model,
    durationMs: Number(raw.total_duration ?? 0) / 1_000_000,
  };
}

/**
 * Generate free-form text (no JSON constraint) — for summaries, essays, etc.
 */
export async function generateText(
  prompt: string,
  options: OllamaGenerateOptions = {},
): Promise<{ content: string; model: string; durationMs: number }> {
  const cfg = _getEnv();
  const { model = cfg.AI_MODEL, system } = options;

  const res = await fetch(`${cfg.OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      format: undefined,
      stream: false,
      options: { temperature: 0.7, num_predict: 2048, top_p: 0.9 },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new AppError(res.status, 'ollama_error', `Ollama text error (${res.status}): ${bodyText || 'Unknown error'}`);
  }

  const raw: { response: string; model: string; total_duration?: number } = await res.json();

  if (!raw.response) {
    throw new AppError(502, 'ollama_empty_response', 'Ollama returned an empty response');
  }

  return {
    content: raw.response,
    model: raw.model,
    durationMs: Number(raw.total_duration ?? 0) / 1_000_000,
  };
}

/**
 * List available Ollama models.
 */
export async function listModels(): Promise<OllamaModelInfo[]> {
  try {
    const cfg = _getEnv();
    const res = await fetch(`${cfg.OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const body = await res.json();
    return body.models ?? [];
  } catch {
    return [];
  }
}

/**
 * Pull a model via Ollama's API.
 */
export async function pullModel(modelName: string): Promise<{ status: string; progress?: { completed: number; total: number } }> {
  const cfg = _getEnv();
  const res = await fetch(`${cfg.OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: false }),
    signal: AbortSignal.timeout(600_000),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new AppError(res.status, 'ollama_pull_error', `Failed to pull model ${modelName}: ${bodyText}`);
  }

  return { status: 'success' };
}
