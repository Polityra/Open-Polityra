import { resolve } from "node:path";

// Vercel and container runtimes inject environment variables directly. Keep
// dotenv as a local-development-only optional dependency so production does
// not need a file-based env loader in the deployed function bundle.
if (process.env.VERCEL !== "1" && !process.env.LAMBDA_TASK_ROOT) {
  try {
    const dotenv = require("dotenv") as typeof import("dotenv");
    dotenv.config({ path: resolve(__dirname, "../../../.env") });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
  }
}
