import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import type { PublicReadObservation } from "./supabase/public-fetch.ts";

let perf: typeof import("./perf");
let now = 100_000;
const originalVerbose = process.env.KOCTEAU_PERF_VERBOSE;
const originalLogs = process.env.KOCTEAU_PERF_LOGS;
before(async () => {
  process.env.KOCTEAU_PERF_VERBOSE = "1";
  process.env.KOCTEAU_PERF_LOGS = "1";
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      return specifier === "server-only" ? { url: "perf-test:empty", shortCircuit: true } : next(specifier, context);
    },
    load(url, context, next) {
      return url === "perf-test:empty" ? { format: "commonjs", source: "module.exports = {};", shortCircuit: true } : next(url, context);
    },
  });
  try { perf = await import("./perf"); } finally { hooks.deregister(); }
});
after(() => {
  if (originalVerbose === undefined) delete process.env.KOCTEAU_PERF_VERBOSE;
  else process.env.KOCTEAU_PERF_VERBOSE = originalVerbose;
  if (originalLogs === undefined) delete process.env.KOCTEAU_PERF_LOGS;
  else process.env.KOCTEAU_PERF_LOGS = originalLogs;
});
beforeEach(() => { now += 1_000; });
const observation: PublicReadObservation = {
  operation: "entities", outcome: "http_error", phase: "complete", status: 503,
  queueMs: 0, headersMs: 20, bodyMs: 5, totalMs: 25, bytes: 2,
};

test("data read diagnostics bound burst log volume and count suppressed observations", (t) => {
  t.mock.method(Date, "now", () => now);
  const warn = t.mock.method(console, "warn", () => {});
  for (let i = 0; i < 100; i++) perf.reportPublicRead(observation);
  assert.equal(warn.mock.callCount(), 10);
  now += 1_000;
  perf.reportPublicRead(observation);
  assert.equal(warn.mock.callCount(), 11);
  const last = warn.mock.calls.at(-1)!.arguments[0] as Record<string, unknown>;
  assert.equal(last.event, "public_data_read");
  assert.equal(last.suppressed, 90);
  assert.equal(last.headers_ms, 20);
  assert.equal(last.body_ms, 5);
});

test("caller cancellation is diagnostic information rather than a failure warning", (t) => {
  t.mock.method(Date, "now", () => now);
  const warn = t.mock.method(console, "warn", () => {});
  const info = t.mock.method(console, "info", () => {});
  perf.reportPublicRead({ ...observation, outcome: "cancelled", phase: "queue", status: null });
  assert.equal(warn.mock.callCount(), 0);
  assert.equal(info.mock.callCount(), 1);
});
