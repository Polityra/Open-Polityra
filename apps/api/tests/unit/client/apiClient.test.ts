import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient, resolveApiBaseUrl } from "../../../../../packages/api-client/src/index";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiClient unauthorized responses", () => {
  it("uses the same-origin API route in production unless an external API origin is configured", () => {
    expect(resolveApiBaseUrl(undefined, true)).toBe("");
    expect(resolveApiBaseUrl("http://localhost:4000", true)).toBe("");
    expect(resolveApiBaseUrl("https://api.example.org", true)).toBe("https://api.example.org");
  });

  it("defaults to the local API server during development", () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe("http://localhost:4000");
  });

  it("removes trailing base URL slashes with bounded linear scanning", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new ApiClient({ baseUrl: `https://api.example.org${"/".repeat(20_000)}` });

    await client.get("/health");

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.org/health", expect.any(Object));
  });

  it("sends same-origin API requests when the base URL is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { status: "healthy" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new ApiClient({ baseUrl: resolveApiBaseUrl(undefined, true) });

    await client.get("/api/v1/health");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/health", expect.any(Object));
  });

  it("notifies the auth provider when an authenticated request has an invalid token", async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            error: { code: "unauthorized", message: "Invalid or expired token" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const client = new ApiClient({
      baseUrl: "http://localhost:4000",
      token: "expired-token",
      onUnauthorized,
    });

    await expect(client.get("/api/v1/sources")).rejects.toMatchObject({
      code: "unauthorized",
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("does not clear a session for a login failure without an auth token", async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            error: { code: "unauthorized", message: "Invalid credentials" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const client = new ApiClient({ baseUrl: "http://localhost:4000", onUnauthorized });

    await expect(client.post("/api/v1/auth/login", {})).rejects.toMatchObject({
      code: "unauthorized",
      status: 401,
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
