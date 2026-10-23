import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";

// Fixed loopback targets prevent this fault injector from reaching cloud data.
const fixture = "http://127.0.0.1:54321";
const targets = [["baseline", "http://127.0.0.1:3001"], ["candidate", "http://127.0.0.1:3000"]];
const unique = Date.now().toString(36);
async function get(url) {
  const start = performance.now();
  const r = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  const body = await r.json();
  return { status: r.status, ms: performance.now() - start,
    readiness: r.headers.get("X-Kocteau-Search-Status"),
    ids: Array.isArray(body) ? body.map((x) => x.entity_id) : [] };
}
async function configure(db = "healthy", provider = "healthy") {
  return get(fixture + "/__fixture/config?db=" + db + "&provider=" + provider);
}
async function stats() { return (await (await fetch(fixture + "/__fixture/stats")).json()).stats; }
function search(origin, q) { return origin + "/api/search?" + new URLSearchParams({ q, source: "local" }); }
const reports = [];
try {
  await configure();
  assert.equal((await fetch(fixture + "/rest/v1/unknown_table")).status, 404);
  assert.equal((await fetch(fixture + "/rest/v1/rpc/unknown_rpc")).status, 404);
  for (const [, target] of targets) await get(search(target, "warm-" + unique));
  for (const scenario of ["healthy", "fail"]) {
    for (const [mode, target] of targets) {
      await configure(scenario);
      const before = await stats();
      const queries = Array.from({ length: 16 }, (_, i) =>
        [..."cocteau"].map((c, bit) => i & (1 << bit) ? c.toUpperCase() : c).join("") + " " + scenario + "-" + unique);
      const results = await Promise.all(queries.map((q) => get(search(target, q))));
      await pause(100);
      const after = await stats();
      if (scenario === "healthy") {
        for (const r of results) assert.deepEqual(r.ids, ["00000000-0000-4000-8000-000000000001"]);
      } else if (mode === "candidate") {
        for (const r of results) { assert.equal(r.status, 502); assert.equal(r.readiness, "degraded"); }
      }
      if (mode === "candidate") assert.equal(after.db - before.db, 7, "one shared fill must issue exactly seven reads");
      reports.push({ mode, scenario, queries: 16, dbHttpRequests: after.db - before.db,
        p95Ms: Math.round(results.map((r) => r.ms).sort((a, b) => a - b)[15]),
        statuses: results.map((r) => r.status), matches: results.map((r) => r.ids.length) });
    }
  }
  const candidate = targets[1][1], q = "stalled-" + unique;
  await configure("stall");
  const stalled = await get(search(candidate, q));
  assert.equal(stalled.status, 502); assert.ok(stalled.ms < 4_000);
  await pause(100); assert.equal((await stats()).active, 0);
  reports.push({ scenario: "stalled_db", ...stalled });
  await configure("healthy", "stall");
  const legacy = await get(candidate + "/api/deezer/search?" + new URLSearchParams({ q: "legacy-" + unique, type: "track" }));
  assert.equal(legacy.status, 502); assert.ok(legacy.ms < 4_000);
  await pause(100); assert.equal((await stats()).active, 0, "the stalled provider must release all connections");
  reports.push({ scenario: "stalled_legacy_provider", ...legacy });
  await configure(); await pause(1_050);
  const recovered = await get(search(candidate, q));
  assert.equal(recovered.status, 200); assert.equal(recovered.readiness, "fresh"); assert.equal(recovered.ids.length, 1);
  reports.push({ scenario: "recovery", ...recovered });
  console.log(JSON.stringify(reports, null, 2));
} finally { await configure(); }
