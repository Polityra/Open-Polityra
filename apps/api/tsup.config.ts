import { defineConfig } from "tsup";

// Bundle the API and its dependencies into one CommonJS file so the deployed
// function does not depend on node_modules being traced or hoisted.
export default defineConfig({
  entry: ["src/index.ts", "src/server.ts"],
  format: ["cjs"],
  outDir: "dist",
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  splitting: false,
  noExternal: [/.*/],
  external: ["dotenv"],
});
