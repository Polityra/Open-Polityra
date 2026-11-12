import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const workerDir = resolve("services/analysis-worker");
const python = resolve(
  workerDir,
  process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python",
);
const workerCommand = existsSync(python) ? python : "poetry";
const workerArgs = existsSync(python) ? ["-m", "src.main"] : ["run", "dev"];
const children = [
  spawn("turbo", ["run", "dev", "--parallel"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  }),
  spawn(workerCommand, workerArgs, {
    cwd: workerDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  }),
];

let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(`Could not start ${child.spawnfile}: ${error.message}`);
    console.error(
      "Set up the analysis worker virtual environment or install Poetry; see services/analysis-worker/README.md.",
    );
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`${child.spawnfile} exited (${signal ?? code}).`);
      stop(code || 1);
    }
  });
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
