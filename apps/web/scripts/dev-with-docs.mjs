import { watch } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { constants } from "node:os";
import path from "node:path";
import { buildDocs, repositoryRoot, catalogPath } from "./build-docs.mjs";

const require = createRequire(import.meta.url);
let watchers = [];
let timer;
let generation = Promise.resolve();
let stopped = false;

function stopWatching() {
  stopped = true;
  clearTimeout(timer);
  watchers.forEach((watcher) => watcher.close());
}

async function refresh() {
  if (stopped) return false;
  try {
    const { records } = await buildDocs();
    if (stopped) return false;
    watchers.forEach((watcher) => watcher.close());
    const filenames = new Set([catalogPath, ...records.map((record) => path.join(repositoryRoot, record.source))]);
    watchers = [...new Set([...filenames].map((filename) => path.dirname(filename)))]
      .map((directory) => watch(directory, (_event, filename) => {
        if (stopped) return;
        if (filename && !filenames.has(path.join(directory, String(filename)))) return;
        clearTimeout(timer);
        timer = setTimeout(() => { generation = generation.then(refresh); }, 150);
      }));
    console.log(`Documentation: ${records.length} pages ready.`);
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}

if (!await refresh()) process.exit(1);
const next = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], { stdio: "inherit" });
next.on("exit", (code, signal) => {
  stopWatching();
  process.exitCode = code ?? (signal ? 128 + constants.signals[signal] : 1);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { stopWatching(); next.kill(signal); });
}
