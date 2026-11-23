// Vercel entrypoint. Must exist in the repo (dist/ is gitignored); it loads the
// self-contained bundle that `pnpm build` (tsup) produces.
module.exports = require("./dist/index.js").default;
