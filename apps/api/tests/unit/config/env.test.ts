import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env schema", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PORT", "3001");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("validates correct env", async () => {
    const { getEnv } = await import("../../../src/config/env");
    expect(() => getEnv()).not.toThrow();
  });

  it("throws on missing JWT_SECRET", async () => {
    vi.stubEnv("JWT_SECRET", "");
    const mod = await import("../../../src/config/env");
    expect(() => mod.getEnv()).toThrow(/JWT_SECRET/);
  });
});
