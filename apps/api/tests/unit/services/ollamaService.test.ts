import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("local Ollama provider", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
    vi.stubEnv("OLLAMA_BASE_URL", "http://localhost:11434");
    vi.stubEnv("AI_MODEL", "olmo-3:7b");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the configured local model when available", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        models: [{ name: "olmo-3:7b", model: "olmo-3:7b" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { checkOllamaStatus } = await import("../../../src/services/ollamaService");
    const status = await checkOllamaStatus();

    expect(status).toMatchObject({
      available: true,
      modelAvailable: true,
      provider: "ollama",
      selectedModel: "olmo-3:7b",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:11434/api/tags",
      expect.any(Object),
    );
  });

  it("does not fall back to a hosted model when the local model is missing", async () => {
    const fetchMock = vi.fn(async () => Response.json({ models: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const { checkOllamaStatus } = await import("../../../src/services/ollamaService");
    const status = await checkOllamaStatus();

    expect(status).toMatchObject({
      available: false,
      modelAvailable: false,
      provider: null,
      selectedModel: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:11434/api/tags",
      expect.any(Object),
    );
  });

  it("returns free-form chat text without requesting JSON format", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      if (String(input).endsWith("/api/tags")) {
        return Response.json({ models: [{ name: "olmo-3:7b", model: "olmo-3:7b" }] });
      }
      return Response.json({
        model: "olmo-3:7b",
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
    expect(chatCall?.[0]).toBe("http://localhost:11434/api/chat");
    expect(JSON.parse(String(chatCall?.[1]?.body))).not.toHaveProperty("format");
  });

  it("reports unavailable when the local Ollama server cannot be reached", async () => {
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
