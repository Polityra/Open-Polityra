import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Ollama provider selection", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
    vi.stubEnv("OLLAMA_BASE_URL", "http://localhost:11434");
    vi.stubEnv("AI_PROVIDER", "ollama");
    vi.stubEnv("AI_MODEL", "qwen3:14b");
    vi.stubEnv("OLLAMA_CLOUD_MODEL", "gemma4:31b");
    vi.stubEnv("OLLAMA_API_KEY", "");
    vi.stubEnv("AI_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("prefers the configured local model when available", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        models: [{ name: "qwen3:14b", model: "qwen3:14b" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { checkOllamaStatus } = await import("../../../src/services/ollamaService");
    const status = await checkOllamaStatus();

    expect(status).toMatchObject({
      available: true,
      modelAvailable: true,
      provider: "ollama",
      selectedModel: "qwen3:14b",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses the configured cloud model when the local model is missing", async () => {
    vi.stubEnv("AI_API_KEY", "test-cloud-key");
    const fetchMock = vi.fn(async (input: URL | RequestInfo, _init?: RequestInit) => {
      if (String(input) === "http://localhost:11434/api/tags") {
        return Response.json({ models: [] });
      }
      if (String(input) === "https://ollama.com/api/tags") {
        return Response.json({ models: [{ name: "gemma4:31b", model: "gemma4:31b" }] });
      }
      return Response.json({
        model: "gemma4:31b",
        message: { role: "assistant", content: '{"ready":true}' },
        total_duration: 1_000_000,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { checkOllamaStatus, generateChat } = await import("../../../src/services/ollamaService");
    const status = await checkOllamaStatus();

    expect(status).toMatchObject({
      available: true,
      modelAvailable: true,
      provider: "ollama-cloud",
      selectedModel: "gemma4:31b",
    });

    await generateChat([{ role: "user", content: "Test" }], {
      model: status.selectedModel ?? undefined,
      provider: status.provider ?? undefined,
      format: "json",
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://ollama.com/api/chat",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-cloud-key" }),
      }),
    );
  });

  it("returns free-form chat text without requesting JSON format", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo, _init?: RequestInit) => {
      if (String(input).endsWith("/api/tags")) {
        return Response.json({ models: [{ name: "qwen3:14b", model: "qwen3:14b" }] });
      }
      return Response.json({
        model: "qwen3:14b",
        message: { role: "assistant", content: "A readable response." },
        total_duration: 1_000_000,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { generateChat } = await import("../../../src/services/ollamaService");
    const result = await generateChat([{ role: "user", content: "Explain briefly." }]);

    expect(result.content).toBe("A readable response.");
    const chatCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/api/chat"));
    expect(chatCall).toBeDefined();
    expect(JSON.parse(String(chatCall?.[1]?.body))).not.toHaveProperty("format");
  });

  it("reports unavailable when no local model or cloud key is configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Ollama is offline");
      }),
    );

    const { checkOllamaStatus } = await import("../../../src/services/ollamaService");
    const status = await checkOllamaStatus();

    expect(status).toMatchObject({
      available: false,
      modelAvailable: false,
      provider: null,
      selectedModel: null,
    });
  });
});
