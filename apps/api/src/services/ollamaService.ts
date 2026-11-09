import { getEnv } from "../config/env";
import type { Env } from "../config/env";
import { AppError } from "../errors/appError";

let cachedEnv: Env | null = null;

function _getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = getEnv();
  return cachedEnv;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaGenerateOptions {
  model?: string;
  provider?: "ollama" | "ollama-cloud";
  system?: string;
  stream?: boolean;
  format?: "json" | "text";
  template?: string;
}

export type OllamaProvider = "ollama" | "ollama-cloud";

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

function getCloudApiKey(cfg: Env): string {
  return cfg.OLLAMA_API_KEY || (cfg.AI_PROVIDER.toLowerCase() === "ollama" ? cfg.AI_API_KEY : "");
}

async function fetchModels(baseUrl: string, apiKey?: string): Promise<OllamaModelInfo[] | null> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;

    const body: OllamaListModelsResponse = await res.json();
    return Array.isArray(body.models) ? body.models : null;
  } catch {
    return null;
  }
}

function hasModel(models: OllamaModelInfo[], model: string): boolean {
  return models.some((item) => item.model === model || item.name === model);
}

/**
 * Select a configured local model when available, otherwise use Ollama Cloud.
 */
export async function checkOllamaStatus(requestedModel?: string): Promise<{
  available: boolean;
  models: string[];
  modelAvailable: boolean;
  provider: OllamaProvider | null;
  selectedModel: string | null;
}> {
  const cfg = _getEnv();
  const localModels = await fetchModels(cfg.OLLAMA_BASE_URL);
  const localModel = requestedModel || cfg.AI_MODEL;

  if (localModels && hasModel(localModels, localModel)) {
    return {
      available: true,
      models: localModels.map((item) => item.model),
      modelAvailable: true,
      provider: "ollama",
      selectedModel: localModel,
    };
  }

  const apiKey = getCloudApiKey(cfg);
  if (apiKey) {
    const cloudModels = await fetchModels("https://ollama.com", apiKey);
    const cloudModel = requestedModel || cfg.OLLAMA_CLOUD_MODEL;
    if (cloudModels && hasModel(cloudModels, cloudModel)) {
      return {
        available: true,
        models: localModels?.map((item) => item.model) ?? [],
        modelAvailable: true,
        provider: "ollama-cloud",
        selectedModel: cloudModel,
      };
    }
  }

  return {
    available: false,
    models: localModels?.map((item) => item.model) ?? [],
    modelAvailable: false,
    provider: null,
    selectedModel: null,
  };
}

/**
 * Generate text using Ollama's chat endpoint with JSON mode support.
 */
export async function generateChat(
  messages: OllamaChatMessage[],
  options: OllamaGenerateOptions = {},
): Promise<{ content: string; model: string; durationMs: number }> {
  const cfg = _getEnv();
  const { model = cfg.AI_MODEL, system, format = "text" } = options;
  let provider = options.provider;
  let selectedModel = model;

  if (!provider) {
    const status = await checkOllamaStatus(options.model);
    if (!status.available || !status.provider || !status.selectedModel) {
      throw new AppError(
        503,
        "ollama_unavailable",
        "No configured Ollama model is available locally or in Ollama Cloud.",
      );
    }
    provider = status.provider;
    selectedModel = status.selectedModel;
  }

  const apiKey = provider === "ollama-cloud" ? getCloudApiKey(cfg) : "";
  if (provider === "ollama-cloud" && !apiKey) {
    throw new AppError(
      503,
      "ollama_cloud_api_key_missing",
      "OLLAMA_API_KEY is required to use Ollama Cloud.",
    );
  }

  const ollamaMessages = messages.filter((m) => m.content.trim());

  const body: Record<string, unknown> = {
    model: selectedModel,
    messages: system
      ? [
          { role: "system" as const, content: system },
          ...ollamaMessages.map((m) => ({ role: m.role as string, content: m.content })),
        ]
      : ollamaMessages.map((m) => ({ role: m.role as string, content: m.content })),
    format: format === "json" ? "json" : undefined,
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 2048,
      top_p: 0.9,
    },
  };

  const baseUrl = provider === "ollama-cloud" ? "https://ollama.com" : cfg.OLLAMA_BASE_URL;
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new AppError(
      res.status,
      "ollama_error",
      `Ollama ${provider} chat error (${res.status}): ${bodyText || "Unknown error"}`,
    );
  }

  const raw: OllamaChatResponse = await res.json();

  if (!raw.message?.content) {
    throw new AppError(502, "ollama_empty_response", "Ollama returned an empty response");
  }

  // Try to parse and re-format JSON responses for consistency
  let content = raw.message.content;
  if (format === "json") {
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
  let provider = options.provider;
  let selectedModel = model;

  if (!provider) {
    const status = await checkOllamaStatus(options.model);
    if (!status.available || !status.provider || !status.selectedModel) {
      throw new AppError(
        503,
        "ollama_unavailable",
        "No configured Ollama model is available locally or in Ollama Cloud.",
      );
    }
    provider = status.provider;
    selectedModel = status.selectedModel;
  }

  const apiKey = provider === "ollama-cloud" ? getCloudApiKey(cfg) : "";
  if (provider === "ollama-cloud" && !apiKey) {
    throw new AppError(
      503,
      "ollama_cloud_api_key_missing",
      "OLLAMA_API_KEY is required to use Ollama Cloud.",
    );
  }

  const baseUrl = provider === "ollama-cloud" ? "https://ollama.com" : cfg.OLLAMA_BASE_URL;
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      system,
      format: undefined,
      stream: false,
      options: { temperature: 0.7, num_predict: 2048, top_p: 0.9 },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new AppError(
      res.status,
      "ollama_error",
      `Ollama ${provider} text error (${res.status}): ${bodyText || "Unknown error"}`,
    );
  }

  const raw: { response: string; model: string; total_duration?: number } = await res.json();

  if (!raw.response) {
    throw new AppError(502, "ollama_empty_response", "Ollama returned an empty response");
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
    const res = await fetch(`${cfg.OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
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
export async function pullModel(
  modelName: string,
): Promise<{ status: string; progress?: { completed: number; total: number } }> {
  const cfg = _getEnv();
  const res = await fetch(`${cfg.OLLAMA_BASE_URL}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: modelName, stream: false }),
    signal: AbortSignal.timeout(600_000),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new AppError(
      res.status,
      "ollama_pull_error",
      `Failed to pull model ${modelName}: ${bodyText}`,
    );
  }

  return { status: "success" };
}
