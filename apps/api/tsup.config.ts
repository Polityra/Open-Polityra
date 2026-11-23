import { defineConfig } from "tsup";

// Bundle the API (and its npm dependencies) into a single CommonJS file so the
// deployed function does not depend on node_modules being traced or hoisted.
export default defineConfig({
  entry: ["src/index.ts", "src/server.ts"],
  format: ["cjs"],
  outDir: "dist",
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  splitting: false,
  // Inline every dependency, including express, into the bundle.
  noExternal: [/.*/],
  // dotenv is optional and only loaded in local development (see loadEnv.ts).
  external: ["dotenv"],
});
