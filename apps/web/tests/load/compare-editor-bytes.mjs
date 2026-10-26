import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const editor = "apps/web/components/reviews/edit-review-dialog.tsx";
const reportPath = resolve(root, ".codex-private/journey-tracing/report.json");
const baselineRef = process.env.KOCTEAU_EDITOR_BASELINE_REF || "";
if (baselineRef) assert.match(baselineRef, /^[a-f0-9]{40}$/);
execFileSync("git", ["diff", "--exit-code", "HEAD", "--", editor], { cwd: root });
const candidateSource = await readFile(resolve(root, editor), "utf8");

async function run(phase) {
  const result = spawnSync("pnpm", ["perf:journey:verify"], {
    cwd: root, env: process.env, encoding: "utf8",
    timeout: 480000, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const output = String(result.stdout || "") + String(result.stderr || "");
    console.error(output.slice(0, 1000) + "\n" + output.slice(-5000));
    throw new Error("Native navigation failed: " + phase + "; " + (result.error || result.status));
  }
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const scripts = report.results.filter((row) => row.journey === "reading-script-bytes");
  assert.equal(scripts.length, 4);
  console.log("NATIVE_NAV_RESULT " + JSON.stringify({
    phase, at: report.at, records: report.results.length, scripts,
    runtimeOriginReads: report.runtimeOriginReads,
    limits: report.limits,
  }));
  return scripts;
}

let baseline;
try {
  if (baselineRef) {
    const source = execFileSync("git", ["show", baselineRef + ":" + editor], {
      cwd: root, encoding: "utf8",
    });
    await writeFile(resolve(root, editor), source);
    baseline = await run("baseline-editor");
  }
  await writeFile(resolve(root, editor), candidateSource);
  const candidate = await run("candidate");
  if (baseline) {
    const comparisons = [];
    for (const old of baseline.filter((row) => !row.authenticated)) {
      const next = candidate.find((row) => !row.authenticated && row.mobile === old.mobile);
      assert.ok(next);
      for (const step of ["list", "review", "track"]) {
        const before = old.scripts[step], after = next.scripts[step];
        assert.ok(before.decodedBytes > 0 && after.decodedBytes > 0);
        comparisons.push({ mobile: old.mobile, step, before, after,
          savedDecodedBytes: before.decodedBytes - after.decodedBytes });
      }
      assert.ok(old.scripts.track.decodedBytes - next.scripts.track.decodedBytes >= 10 * 1024,
        "Closed editor must remove meaningful JavaScript from the guest reading journey");
    }
    console.log("EDITOR_BYTE_COMPARISON " + JSON.stringify({
      baselineRef, comparisons,
      limits: "Same CI worker, actual production-mode Next/WebKit, synthetic Data/Auth. Browser-reported script body sizes; not production latency, network transfer totals, RUM or capacity.",
    }));
  }
} finally {
  await writeFile(resolve(root, editor), candidateSource);
}
