import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { envSchema } from "../../../src/config/env";
import { rateLimiter } from "../../../src/middleware/rateLimiter";

describe("rateLimiter", () => {
  it("limits requests without creating the limiter during a request", async () => {
    const env = envSchema.parse({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://localhost:5432/test",
      JWT_SECRET: "test_secret_at_least_32_characters_long!!",
      RATE_LIMIT_MAX: 1,
    });
    const app = express();
    app.use(rateLimiter(env));
    app.get("/", (_req, res) => res.status(200).send("ok"));

    expect((await request(app).get("/")).status).toBe(200);
    expect((await request(app).get("/")).status).toBe(429);
  });
});
